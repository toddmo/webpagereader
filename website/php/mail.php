<?php
    // My modifications to mailer script from:
    // http://blog.teamtreehouse.com/create-ajax-contact-form
    // Added input sanitizing to prevent injection

    // Only process POST reqeusts.
    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        // Get the form fields and remove whitespace.
        $name = strip_tags(trim($_POST["name"]));
		$name = str_replace(array("\r","\n"),array(" "," "),$name);
        $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
        $message = trim($_POST["comments"]);
        $recaptcha = $_POST['g-recaptcha-response'];

        // Check that data was sent to the mailer.
        if ( empty($recaptcha) OR empty($name) OR empty($message) OR !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Set a 400 (bad request) response code and exit.
            //http_response_code(400);
            echo "Oops! There was a problem with your submission. Please complete the form and try again.";
            exit;
        }

        // Make sure user is not a robot
        $recaptcha_secret = "6LcHSAkUAAAAAFDD7Fd0JThgFpDn9G5UKGa0nfc9";
        $response = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=".$recaptcha_secret."&response=".$recaptcha);
        $response = json_decode($response, true);
        if($response["success"] === false)
        {
            //http_response_code(400);
            echo "You are a robot";
            exit;
        }        

        // Set the recipient email address.
        // FIXME: Update this to your desired email address.
        $recipient = "info@webpagereader.com";
        //$recipient = "toddmorrow1@gmail.com";

        // Set the email subject.
        $subject = "New contact from $name";

        // Build the email content.
        $email_content = "Name: $name\n";
        $email_content .= "Email: $email\n\n";
        $email_content .= "Message:\n$message\n";

        // Build the email headers.
        //$email_headers = "From: $name <$email>";
        $email_headers = "Reply-To: $name < $email>" . "\r\n";
        $email_headers .= 'From: Comment Form <info@webpagereader.com>' . "\r\n";

        // Send the email.
        if (mail($recipient, $subject, $email_content, $email_headers)) {
            // Set a 200 (okay) response code.
            http_response_code(200);
            echo "Thank You! Your message has been sent.";
        } else {
            // Set a 500 (internal server error) response code.
            //http_response_code(500);
            echo error_get_last()[message] . " Oops! Something went wrong and we couldn't send your message.";
        }

    } else {
        // Not a POST request, set a 403 (forbidden) response code.
        http_response_code(403);
        echo "There was a problem with your submission, please try again.";
    }

?>
