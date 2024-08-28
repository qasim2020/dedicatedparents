import request from 'supertest';
import { app } from '../dp2.js';

describe('POST /sendMsgToEmail', () => {

  // it('should return 200 when email is sent successfully', async () => {
  //   const response = await request(app)
  //     .post('/sendMsgToEmail')
  //     .send({
  //       msgText: "Test message",
  //       toEmail: "qasimali24@gmail.com",
  //       msgSubject: "Test Subject"
  //     });
    
  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);
  // });

  it('should return 404 when required fields are missing', async () => {
    const response = await request(app)
      .post('/sendMsgToEmail')
      .send({
        msgText: "Test message",
        toEmail: "qasimali24@gmail.com"
        // msgSubject is missing
      });
    expect(response.status).toBe(404);
    expect(response.text).toBe("Required fields are missing.");
  });

});
