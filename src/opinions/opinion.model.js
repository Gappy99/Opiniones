'use strict';

import mongoose from 'mongoose';

const opinionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxLength: [150, 'El título no puede exceder 150 caracteres'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es requerida'],
      trim: true,
      maxLength: [50, 'La categoría no puede exceder 50 caracteres'],
    },
    content: {
      type: String,
      required: [true, 'El contenido es requerido'],
      trim: true,
      maxLength: [2000, 'El contenido no puede exceder 2000 caracteres'],
    },
    authorId: {
      type: String,
      required: [true, 'El ID del autor es requerido'],
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indices compuestos para optimizar queries
opinionSchema.index({ isActive: 1, createdAt: -1 });
opinionSchema.index({ authorId: 1, isActive: 1 });
opinionSchema.index({ category: 1, isActive: 1 });

export default mongoose.model('Opinion', opinionSchema);
