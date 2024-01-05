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

resource "aws_s3_bucket_cors_configuration" "bucket"{
    bucket = aws_s3_bucket.bucket.id
    
    cors_rule {
        allowed_headers = ["*"]
        allowed_methods = ["PUT", "GET"]
        allowed_origins = ["*"]
    }
}

