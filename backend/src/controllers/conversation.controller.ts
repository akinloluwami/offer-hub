import { Request, Response } from 'express';
import { ConversationService } from '@/services/conversation.service';
import { CreateConversationDTO } from '@/types/conversation.types';
import { AppError } from '@/utils/AppError';
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};


export class ConversationController {
  static async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const conversationData: CreateConversationDTO = req.body;

      if (!conversationData.client_id || !conversationData.freelancer_id) {
        throw new AppError('client_id and freelancer_id are required', 400);
      }

    
      if (!isUUID(conversationData.client_id)) {
        throw new AppError('Invalid client_id format', 400);
      }

      if (!isUUID(conversationData.freelancer_id)) {
        throw new AppError('Invalid freelancer_id format', 400);
      }

      if (conversationData.project_id && !isUUID(conversationData.project_id)) {
        throw new AppError('Invalid project_id format', 400);
      }

      if (conversationData.service_request_id && !isUUID(conversationData.service_request_id)) {
        throw new AppError('Invalid service_request_id format', 400);
      }

    
      if (conversationData.client_id === conversationData.freelancer_id) {
        throw new AppError('Client and freelancer cannot be the same user', 400);
      }

      const conversation = await ConversationService.createConversation(conversationData);

      res.status(201).json({
        success: true,
        message: 'Conversation_created_successfully',
        data: conversation
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  static async getConversationsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      
      if (!isUUID(userId)) {
        throw new AppError('Invalid userId format', 400);
      }

      const conversations = await ConversationService.getConversationsByUserId(userId);

      res.status(200).json({
        success: true,
        message: 'Conversations_fetched_successfully',
        data: conversations
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  static async getConversationById(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

  
      if (!isUUID(conversationId)) {
        throw new AppError('Invalid conversationId format', 400);
      }

      const conversation = await ConversationService.getConversationById(conversationId);

      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Conversation_fetched_successfully',
        data: conversation
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }
}