import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace calculateFlightTimes {
    type ParamsDefinition = {
        flightId: {
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * calculate Flight Times
     */
    interface Params {
        readonly flightId: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * calculate Flight Times
         */
        applyAction<P extends calculateFlightTimes.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<calculateFlightTimes.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * calculate Flight Times
 * @param {ActionParam.PrimitiveType<"string">} flightId
 */
export interface calculateFlightTimes extends ActionDefinition<calculateFlightTimes.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'calculateFlightTimes';
        description: 'calculate Flight Times';
        displayName: 'calculateFlightTimes';
        modifiedEntities: {};
        parameters: calculateFlightTimes.ParamsDefinition;
        rid: 'ri.actions.main.action-type.87e53163-c96c-46e5-be26-52bfd133e273';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: calculateFlightTimes.Signatures;
    };
    apiName: 'calculateFlightTimes';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const calculateFlightTimes: calculateFlightTimes;
