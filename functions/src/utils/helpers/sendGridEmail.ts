/* eslint-disable max-len */
import sgMail from "@sendgrid/mail";
import {exportSecret} from "../config/config";

export async function sendGridEmail(
    recordsUpdated: number,
    totalRecords: number
) {
  const secrets: any = await exportSecret();
  const emails: any = secrets.RESET_DAILY_EMAILS;
  for (let i = 0; i < emails.length; i++) {
    try {
      sgMail.setApiKey(secrets.SENDGRID_API);
      const msg = {
        to: emails[i], // Change to your recipient
        from: secrets.SENDGRID_EMAIL, // Change to your verified sender
        subject: "Capx App - Daily Streak Reset.",
        text: "Hello,",
        html: `<!DOCTYPE html>
          <html>
              <head>
              </head>
              <body>
                  <p>
                      The Daily Streak Reset Function Execution Finished <br> Records Updated : ${recordsUpdated} <br> Total Records: ${totalRecords}
                  </p>
              </body>
          </html>`,
      };
      await sgMail.send(msg);
    } catch (err) {
      console.log("Error:", err);
      await (await import("../tracker/track")).registerError(
          "Streak Reset Notify Function",
          "resetDailyStreakNotify",
          {recordsUpdated, totalRecords, email: emails[i]},
          "CRON Job",
          `Something Went wrong: Sending Email Failed: ${err}`
      );
    }
  }
}
