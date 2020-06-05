import { IValidator } from '../interfaces/IValidator';
import mongoose from 'mongoose';

const Validator = new mongoose.Schema({}, { timestamps: true });

export default mongoose.model<IValidator & mongoose.Document>('Validator', Validator);
