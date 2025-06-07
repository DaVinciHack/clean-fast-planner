import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace getGlobalWindsForFlight {
    type ParamsDefinition = {
        customEtd: {
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        durationHours: {
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        flightId: {
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * Get global winds for flight
     */
    interface Params {
        readonly customEtd?: ActionParam.PrimitiveType<'timestamp'>;
        readonly durationHours?: ActionParam.PrimitiveType<'double'>;
        readonly flightId: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * Get global winds for flight
         */
        applyAction<P extends getGlobalWindsForFlight.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<getGlobalWindsForFlight.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Get global winds for flight
 * @param {ActionParam.PrimitiveType<"timestamp">} [customEtd]
 * @param {ActionParam.PrimitiveType<"double">} [durationHours]
 * @param {ActionParam.PrimitiveType<"string">} flightId
 */
export interface getGlobalWindsForFlight extends ActionDefinition<getGlobalWindsForFlight.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'getGlobalWindsForFlight';
        description: 'Get global winds for flight';
        displayName: 'Get global winds for flight';
        modifiedEntities: {};
        parameters: getGlobalWindsForFlight.ParamsDefinition;
        rid: 'ri.actions.main.action-type.1c814b6a-c6bf-4997-9f78-0de7c01e6865';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: getGlobalWindsForFlight.Signatures;
    };
    apiName: 'getGlobalWindsForFlight';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const getGlobalWindsForFlight: getGlobalWindsForFlight;
