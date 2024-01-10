terraform {
    required_providers {
        aws = {
            source = "hashicorp/aws" 
            version = "5.31.0"
        }
    }
}

provider "aws" {
    region = "us-west-1"
}

resource "aws_s3_bucket" "bucket" {
    bucket = "tcg-application-portal-uploads"
}

resource "aws_s3_bucket_cors_configuration" "bucket" {
    bucket = aws_s3_bucket.bucket.id
    
    cors_rule {
        allowed_headers = ["*"]
        allowed_methods = ["PUT", "GET"]
        allowed_origins = ["*"]
    }
}

resource "aws_ses_template" "confirmation_template" {
    name = "confirmation_template"
    subject = "TCG {{ cycleName }} Application Submission Confirmation"
    text = <<-EOT
    Thanks for submitting your application! This email serves as confirmation of your application submission for {{ cycleName }}. If you have any questions or concerns, email board.tcg@gmail.com.
    This email address is not monitored so any messages sent to it will not be read.

    Please be on the lookout for another email containing your case study night time: 7-8 or 8-9pm on 1/17. Good luck!
    EOT
}

