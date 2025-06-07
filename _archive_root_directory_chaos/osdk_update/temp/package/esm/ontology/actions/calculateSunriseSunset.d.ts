import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace calculateSunriseSunset {
    type ParamsDefinition = {
        flightId: {
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * calculate Sunrise Sunset
     */
    interface Params {
        readonly flightId: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * calculate Sunrise Sunset
         */
        applyAction<P extends calculateSunriseSunset.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<calculateSunriseSunset.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * calculate Sunrise Sunset
 * @param {ActionParam.PrimitiveType<"string">} flightId
 */
export interface calculateSunriseSunset extends ActionDefinition<calculateSunriseSunset.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'calculateSunriseSunset';
        description: 'calculate Sunrise Sunset';
        displayName: 'calculateSunriseSunset';
        modifiedEntities: {};
        parameters: calculateSunriseSunset.ParamsDefinition;
        rid: 'ri.actions.main.action-type.15a20a2c-2d90-4d7e-b5ac-1659284e5a68';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: calculateSunriseSunset.Signatures;
    };
    apiName: 'calculateSunriseSunset';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const calculateSunriseSunset: calculateSunriseSunset;
