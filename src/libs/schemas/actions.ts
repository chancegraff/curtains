import z from 'zod';

import { RuntimeConfigSchema } from './cli';
import {
  CacheValueSchema,
  EventSchema,
  StateErrorEntrySchema,
  StateKeySchema,
  StateSnapshotSchema,
  StateValueSchema,
} from './registry';
import { ListenerSchema } from './state';

// Action payloads
export const SetConfigPayloadSchema = z.object({
  config: RuntimeConfigSchema,
});

export const SaveStatePayloadSchema = z.object({
  key: StateKeySchema,
  value: StateValueSchema,
});

export const CreateSnapshotPayloadSchema = z.object({
  timestamp: z.number(),
});

export const RestoreSnapshotPayloadSchema = z.object({
  snapshot: StateSnapshotSchema,
});

export const AddListenerPayloadSchema = z.object({
  listener: ListenerSchema,
});

export const RemoveListenerPayloadSchema = z.object({
  listenerId: z.string().uuid(),
});

export const EmitEventPayloadSchema = z.object({
  event: EventSchema,
});

export const UpdateCachePayloadSchema = z.object({
  key: z.string(),
  value: CacheValueSchema,
  ttl: z.number(),
});

export const InvalidateCachePayloadSchema = z.object({
  pattern: z.string().optional(),
  all: z.boolean().optional(),
});

export const AcquireLockPayloadSchema = z.object({
  requestId: z.string().uuid(),
});

export const ReleaseLockPayloadSchema = z.object({
  requestId: z.string().uuid(),
});

export const AddErrorPayloadSchema = z.object({
  error: StateErrorEntrySchema,
});

export const AddToHistoryPayloadSchema = z.object({
  snapshot: StateSnapshotSchema,
});

// Registry Actions (discriminated union)
export const SetConfigActionSchema = z.object({
  type: z.literal('SET_CONFIG'),
  payload: SetConfigPayloadSchema,
});

export const SaveStateActionSchema = z.object({
  type: z.literal('SAVE_STATE'),
  payload: SaveStatePayloadSchema,
});

export const CreateSnapshotActionSchema = z.object({
  type: z.literal('CREATE_SNAPSHOT'),
  payload: CreateSnapshotPayloadSchema,
});

export const RestoreSnapshotActionSchema = z.object({
  type: z.literal('RESTORE_SNAPSHOT'),
  payload: RestoreSnapshotPayloadSchema,
});

export const AddListenerActionSchema = z.object({
  type: z.literal('ADD_LISTENER'),
  payload: AddListenerPayloadSchema,
});

export const RemoveListenerActionSchema = z.object({
  type: z.literal('REMOVE_LISTENER'),
  payload: RemoveListenerPayloadSchema,
});

export const EmitEventActionSchema = z.object({
  type: z.literal('EMIT_EVENT'),
  payload: EmitEventPayloadSchema,
});

export const UpdateCacheActionSchema = z.object({
  type: z.literal('UPDATE_CACHE'),
  payload: UpdateCachePayloadSchema,
});

export const InvalidateCacheActionSchema = z.object({
  type: z.literal('INVALIDATE_CACHE'),
  payload: InvalidateCachePayloadSchema,
});

export const AcquireLockActionSchema = z.object({
  type: z.literal('ACQUIRE_LOCK'),
  payload: AcquireLockPayloadSchema,
});

export const ReleaseLockActionSchema = z.object({
  type: z.literal('RELEASE_LOCK'),
  payload: ReleaseLockPayloadSchema,
});

export const AddErrorActionSchema = z.object({
  type: z.literal('ADD_ERROR'),
  payload: AddErrorPayloadSchema,
});

export const ClearErrorsActionSchema = z.object({
  type: z.literal('CLEAR_ERRORS'),
});

export const AddToHistoryActionSchema = z.object({
  type: z.literal('ADD_TO_HISTORY'),
  payload: AddToHistoryPayloadSchema,
});

// All Registry Actions union
export const RegistryActionSchema = z.discriminatedUnion('type', [
  SetConfigActionSchema,
  SaveStateActionSchema,
  CreateSnapshotActionSchema,
  RestoreSnapshotActionSchema,
  AddListenerActionSchema,
  RemoveListenerActionSchema,
  EmitEventActionSchema,
  UpdateCacheActionSchema,
  InvalidateCacheActionSchema,
  AcquireLockActionSchema,
  ReleaseLockActionSchema,
  AddErrorActionSchema,
  ClearErrorsActionSchema,
  AddToHistoryActionSchema,
]);
