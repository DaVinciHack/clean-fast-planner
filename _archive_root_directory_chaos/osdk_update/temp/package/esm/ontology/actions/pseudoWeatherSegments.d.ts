import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace pseudoWeatherSegments {
    type ParamsDefinition = {
        flightId: {
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * Pseudo weather segments
     */
    interface Params {
        readonly flightId: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * Pseudo weather segments
         */
        applyAction<P extends pseudoWeatherSegments.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<pseudoWeatherSegments.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Pseudo weather segments
 * @param {ActionParam.PrimitiveType<"string">} flightId
 */
export interface pseudoWeatherSegments extends ActionDefinition<pseudoWeatherSegments.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'pseudoWeatherSegments';
        description: 'Pseudo weather segments';
        displayName: 'Pseudo weather segments';
        modifiedEntities: {};
        parameters: pseudoWeatherSegments.ParamsDefinition;
        rid: 'ri.actions.main.action-type.175d984c-4e02-4a22-b95a-98d8fec6409a';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: pseudoWeatherSegments.Signatures;
    };
    apiName: 'pseudoWeatherSegments';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const pseudoWeatherSegments: pseudoWeatherSegments;
