# Introduction
TVOC Analysis dashboard is the website for testing TVOC PID proformance.

# Tech Stack
* Angular
* Nginx
* AWS EC2

# Clients
* Internal Employee

# How to contribute
## Modify
* update code in your local VS Code
* run and test it locally

## Sync to github
* push code to github

## Deploy
* build the project local: npm run build
* upload all files under tvoc-data-analysis-dashboard\dist\tvoc-analysis-dashboard\ to [EC2 instance](https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#InstanceDetails:instanceId=i-089e5f436a8f39063) folder /var/www/html/tvoc-analysis-dashboard
