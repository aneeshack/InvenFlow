import mongoose from 'mongoose';

const connectDb= async()=>{
    try {
        const MONGO_URI = process.env.MONGODB_URI;
        
        if(!MONGO_URI){
            throw new Error(
                "Mongo DB connection string not provided in environment variables"
            )
        }
        const connection = await mongoose.connect(MONGO_URI.trim());
        console.log(`Mongodb connected successfully on :${connection.connection.host}`)
    } catch (error:unknown) {
       if(error instanceof Error){
        console.log(error.message)
       }else{
        console.log('An unknown error occurred:',error)
       }
    }
} 

export default connectDb