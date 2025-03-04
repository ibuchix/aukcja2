
// This file is now just a central export point for all auth services
import { signUpDealerWithEmail } from "./signup";
import { initiateOtpSignIn, verifyOtp } from "./signin";

export {
  signUpDealerWithEmail,
  initiateOtpSignIn,
  verifyOtp
};
