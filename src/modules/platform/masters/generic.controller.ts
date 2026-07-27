import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../lib/prisma.ts';

export const generateMasterController = (modelName: string) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await (prisma as any)[modelName].findMany({
          orderBy: { name: 'asc' }
        });
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name } = req.body;
        const data = await (prisma as any)[modelName].create({ data: { name } });
        res.status(201).json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { name } = req.body;
        const data = await (prisma as any)[modelName].update({ where: { id }, data: { name } });
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
    remove: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        await (prisma as any)[modelName].delete({ where: { id } });
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    }
  };
};
