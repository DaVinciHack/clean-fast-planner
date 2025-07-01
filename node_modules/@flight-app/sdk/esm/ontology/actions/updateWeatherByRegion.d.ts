import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace updateWeatherByRegion {
    type ParamsDefinition = {
        regionName: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        timestamp: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
    };
    /**
     * Update weather by region
     */
    interface Params {
        readonly regionName: ActionParam.PrimitiveType<'string'>;
        readonly timestamp?: ActionParam.PrimitiveType<'timestamp'>;
    }
    interface Signatures {
        /**
         * Update weather by region
         */
        applyAction<OP extends ApplyActionOptions>(args: updateWeatherByRegion.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<updateWeatherByRegion.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Update weather by region
 * @param {ActionParam.PrimitiveType<"string">} regionName
 * @param {ActionParam.PrimitiveType<"timestamp">} [timestamp]
 */
export interface updateWeatherByRegion extends ActionDefinition<updateWeatherByRegion.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'updateWeatherByRegion';
        description: 'Update weather by region';
        displayName: 'Update weather by region';
        modifiedEntities: {};
        parameters: updateWeatherByRegion.ParamsDefinition;
        rid: 'ri.actions.main.action-type.1f8f4f94-7e56-487c-87c5-aa083c8a83f5';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: updateWeatherByRegion.Signatures;
    };
    apiName: 'updateWeatherByRegion';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const updateWeatherByRegion: updateWeatherByRegion;
