import type { CEAModel } from '../../types/cea';
import { amfItnModel } from './amf-itn';
import { newIncentivesModel } from './new-incentives';
import { taimakaModel } from './taimaka';
import { smcModel } from './smc';

export const ceaModels: CEAModel[] = [amfItnModel, newIncentivesModel, taimakaModel, smcModel];

export function getModel(id: string): CEAModel {
  return ceaModels.find((m) => m.id === id) ?? amfItnModel;
}
