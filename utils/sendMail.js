
import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: process.env.EMAIL_HOST,//"smtp-relay.brevo.com",
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER ,//"7a2add001@smtp-brevo.com",
    pass: process.env.EMAIL_USER_PASS , //"tCfZPxRXTMwpW084",
  },
});


export const sendMail = async (email, subject, text) => {
	try {
	
		transporter.sendMail({
			from: {
				name: "Xplore",
				address: process.env.EMAIL_SENDER,
			},
			to: email,
			subject: subject,
			text: text,
		});
	} catch (error) {
		console.log("Mail Not sent");
		console.log(error);
	}
};