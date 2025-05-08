import { Request, Response } from 'express';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { ReportService } from '../services/reportService';
import { HTTP_STATUS } from '../constants/httpStatus';
import { IReportService } from '../interfaces/IService/IReportService';

class ReportController {

    constructor(
        // private _reportService: ReportService
        private _reportService: IReportService

    ) {
    }

    async getSalesReport(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate } = req.query;

            const sales = await this._reportService.getSalesReport(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            res.status(HTTP_STATUS.OK).json({success:true, data:sales});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to generate sales report' });
        }
    }

    async getItemsReport(req: Request, res: Response): Promise<void> {
        try {
            const items = await this._reportService.findAll();
            res.status(HTTP_STATUS.OK).json({success:true, data:items});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to generate items report' });
        }
    }

    async getCustomerLedger(req: Request, res: Response): Promise<void> {
        try {
            const sales = await this._reportService.getCustomerLedger(req.params.customerId);
            res.status(HTTP_STATUS.OK).json(sales);
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to generate customer ledger' });
        }
    }

    async exportReport(req: Request, res: Response): Promise<void> {
        try {
            const { type, data } = req.body;
            switch (type) {
                case 'csv':
                    const parser = new Parser();
                    const csv = parser.parse(data);
                    res.header('Content-Type', 'text/csv');
                    res.attachment('report.csv');
                    res.send(csv);
                    break;
                case 'pdf':
                    const doc = new PDFDocument();
                    res.header('Content-Type', 'application/pdf');
                    res.attachment('report.pdf');
                    doc.pipe(res);
                    doc.text(JSON.stringify(data, null, 2));
                    doc.end();
                    break;
                case 'email':
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        }
                    });

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: req.body.email,
                        subject: 'Inventory Report',
                        text: JSON.stringify(data, null, 2)
                    });
                    res.json({ message: 'Report sent successfully' });
                    break;
                default:
                    res.status(400).json({ error: 'Invalid export type' });
            }
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to export report' });
        }
    }

    async sendReport(req: Request, res: Response): Promise<void> {
        try {
            console.log('req.body',req.body)
          const { recipient, subject, body } = req.body;
          const file = (req as any).file;
    
          if (!recipient || !subject || !body || !file) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
              success: false,
              error: 'Missing required fields or file',
            });
            return;
          }
    
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
    
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipient,
            subject,
            text: body,
            attachments: [
              {
                filename: file.originalname,
                content: file.buffer,
              },
            ],
          };
    
          await transporter.sendMail(mailOptions);
    
          res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Report sent successfully',
          });
        } catch (error: any) {
          console.error('Error sending report email:', error);
          res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message || 'Failed to send email',
          });
        }
      }
}

export default ReportController;





