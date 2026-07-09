SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=Midlync.com <no-reply@midlync.com>
OTP_SIGNING_SECRET=put-a-long-random-secret-here