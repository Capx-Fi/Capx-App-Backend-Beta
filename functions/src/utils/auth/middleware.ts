/* eslint-disable max-len */
import * as functions from "firebase-functions";
import {auth} from "../init/init";

export function getUserCredentials(req: any, res: any, next: any) {
  try {
    functions.logger.debug("Extracting User Credentials");
    const jwt = req.headers.authorization.substring(7);
    if (jwt) {
      auth.verifyIdToken(jwt)
          .then( (jwtPayload) => {
            if (jwtPayload.uid) {
              req["jwt"] = jwtPayload;
              req["jwt"]["token_auth"] = req.headers.authorization;
            }
            next();
          })
          .catch((err) => {
            functions.logger.error("Error Validating JWT", err);
            next();
          });
    } else {
      next();
    }
  } catch (err) {
    next();
    functions.logger.error("Error Extracting User Credentials");
  }
}
