# Triton Consulting Group Application Portal
An applicant portal for [Triton Consulting Group](https://www.ucsdtcg.org) (TCG)
to accept and manage applications.

## Project Overview
This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

As a result, it is built on [NextJS](https://nextjs.org/), [DrizzleORM](https://orm.drizzle.team/), 
[TailwindCSS](https://tailwindcss.com/), [tRPC](https://trpc.io/), and 
[NextAuth](https://next-auth.js.org/). It also uses [shadcn](https://ui.shadcn.com/) as for components. 

The code and database utilizes Google OAuth and MySQL ([Planetscale](https://planetscale.com/))
for authentication and data storage. 

## Want to repurpose this for your own organization? Read here
This project is designed to be organization-agnostic, so besides the
sparse TCG-specific branding and information, the app should 
function well for most organizations with an application process.

As a result, if you'd like to use this for your own organization, just
change the favicon specified in `/public/favicon.ico` and any 
information in `/app/page.tsx`.

### Deployment
#### Application
This application is deployed on [Vercel](https://vercel.com), and unless
you expect to exceed [Vercel's free tier](https://vercel.com/pricing),
I'd recommend deploying on Vercel. 

To deploy on Vercel, first fork the project, then follow the steps listed 
[here](https://vercel.com/docs/getting-started-with-vercel/import). 

Make sure to add all the environment variables specified in `.env.example`
to your Vercel project.

#### Database
The project is set up around Planetscale, so once again, unless you 
expect to exceed [Planetscale's free tier](https://planetscale.com/pricing),
I'd recommend using Planetscale for the DB. 

Once the Planetscale DB is setup, push the DB schema to the database
by running `npm run db:push`. 

#### AWS Configuration
All required AWS resources (SES, S3) are defined in `main.tf` and provisioned
by [Terraform](https://www.terraform.io). As a result, you can easily
configure them by running `terraform apply`.

##### SES for Sending Emails
The application portal uses AWS SES to send confirmation emails to applicants
after they submit their application. Change the email template 
by editing the `confirmation_template` resource in `main.tf`.

To use your own domain for sending emails, verify your domain in AWS
SES by following the instructions [here](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html).
Make sure to also change the email address used for sending emails
by editing the `EMAIL_ADDRESS` variable in `src/server/api/routers/application.ts`.

In order to send emails in production, your AWS SES account must be moved
out of the sandbox mode. Instructions on how to do so can be found
[here](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html).

#### S3 for Uploaded File Storage
If you'd like to change the name of the S3 bucket, edit the `main.tf`
file and also update the `BUCKET_NAME` variable in 
`src/server/api/routers/application-response.ts`.

#### Conclusion
The application should now be fully deployed! Good luck with recruitment :)

## Contributing
### Configuring a Development Environment
This project runs on Node version 20. Once you have Node v20 installed,
install all required dependencies by running `npm install`.

Also make sure to configure all required environment variables 
in a `.env` file. You can view `.env.example` for an example environment
file.

Once everything is configured, run the project with `npm run start`

