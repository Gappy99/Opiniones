'use strict';

import mongoose from 'mongoose';

const commentSchema = mongoose.Schema(
  {
    opinionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'El ID de la opinión es requerido'],
      ref: 'Opinion',
      index: true,
    },
    content: {
      type: String,
      required: [true, 'El contenido es requerido'],
      trim: true,
      maxLength: [500, 'El comentario no puede exceder 500 caracteres'],
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
commentSchema.index({ opinionId: 1, isActive: 1, createdAt: -1 });
commentSchema.index({ authorId: 1, isActive: 1 });

export default mongoose.model('Comment', commentSchema);
