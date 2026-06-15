# Email Service Setup Guide

This guide explains how to configure the email service for sending OTP emails and password reset confirmations.

## Supported Email Providers

### Gmail (Recommended)
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" for the app
   - Select "Other (Custom name)" and enter "MoneyLoop Finance"
   - Copy the generated password

### Outlook/Hotmail
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable 2-Factor Authentication
3. Generate an App Password if needed

### Other SMTP Providers
Use your provider's SMTP settings in the configuration below.

## Configuration

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Update Email Configuration
Edit your `.env` file with your email settings:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@moneyloop.com
```

### 3. Email Provider Settings

#### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Outlook
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## Security Features Implemented

### Email Validation
- ✅ Checks if email exists in database
- ✅ Only allows password reset for registered emails

### Account Age Validation
- ✅ Only allows password reset for accounts created 1+ year ago
- ✅ Prevents password reset on recently created accounts

### OTP Security
- ✅ 5-minute OTP expiration
- ✅ One-time use OTP (deleted after verification)
- ✅ Secure 6-digit random OTP generation

### Email Features
- ✅ Professional HTML email templates
- ✅ OTP email with security warnings
- ✅ Password reset confirmation email
- ✅ Branded email design

## Testing the Email Service

### 1. Start the Backend Server
```bash
npm run dev
```

### 2. Test Email Sending
Use the forgot password feature with a valid email that's at least 1 year old.

### 3. Check Email Logs
The server logs will show:
- Email sending status
- OTP generation (for testing)
- Any email errors

## Troubleshooting

### Common Issues

#### "Authentication failed"
- Check your email username and password
- For Gmail, make sure you're using an App Password, not your regular password
- Ensure 2FA is enabled on your Google account

#### "Connection timeout"
- Check your internet connection
- Verify SMTP host and port settings
- Check if your firewall is blocking SMTP ports

#### "Email not sent"
- Check the server logs for detailed error messages
- Verify all email configuration fields are filled
- Ensure the email service is properly initialized

### Debug Mode
To enable detailed email logging, set the following in your `.env`:
```env
DEBUG=email
```

## Security Considerations

1. **Never commit your `.env` file** to version control
2. **Use App Passwords** instead of regular passwords
3. **Enable 2FA** on your email account
4. **Monitor email logs** for suspicious activity
5. **Use a dedicated email account** for the application

## Production Deployment

For production environments:

1. **Use a professional email service** like SendGrid, Mailgun, or AWS SES
2. **Set up email domain authentication** (SPF, DKIM, DMARC)
3. **Monitor email deliverability** and bounce rates
4. **Set up email analytics** and tracking
5. **Use environment variables** for all email configuration

## Email Templates

The system includes two email templates:

### OTP Email
- Professional design with MoneyLoop branding
- Clear OTP display with large, readable font
- Security warnings and expiration notice
- Responsive design for mobile devices

### Password Reset Confirmation
- Success notification
- Direct login link
- Security notice about unauthorized resets
- Professional branding

Both templates are fully responsive and include proper HTML email structure for maximum compatibility.
