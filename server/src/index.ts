import mongoose from 'mongoose';
import app from './util/app';
import connectDb from './config/database';


const PORT = process.env.PORT;
const HOST = process.env.HOST;

(async () => {
    try {
        await connectDb();

        app.listen(PORT, () => { 
            console.log(`Server is running at http://${HOST}:${PORT}`);
        });
    } catch (error) {
        if (error instanceof mongoose.Error) {
            console.log(`Failed to connect to database: ${error.message}`);
        }
        process.exit(1);
    }
})();

export default app;