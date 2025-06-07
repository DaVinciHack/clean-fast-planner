import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace getWeatherForAlternates {
    type ParamsDefinition = {
        flightId: {
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        updatedEtd: {
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
    };
    /**
     * Get weather for alternates with geoline
     */
    interface Params {
        readonly flightId: ActionParam.PrimitiveType<'string'>;
        readonly updatedEtd?: ActionParam.PrimitiveType<'timestamp'>;
    }
    interface Signatures {
        /**
         * Get weather for alternates with geoline
         */
        applyAction<P extends getWeatherForAlternates.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<getWeatherForAlternates.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Get weather for alternates with geoline
 * @param {ActionParam.PrimitiveType<"string">} flightId
 * @param {ActionParam.PrimitiveType<"timestamp">} [updatedEtd]
 */
export interface getWeatherForAlternates extends ActionDefinition<getWeatherForAlternates.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'getWeatherForAlternates';
        description: 'Get weather for alternates with geoline';
        displayName: 'Get weather for alternates';
        modifiedEntities: {};
        parameters: getWeatherForAlternates.ParamsDefinition;
        rid: 'ri.actions.main.action-type.862aa561-b574-4049-a841-71a295cb43b4';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: getWeatherForAlternates.Signatures;
    };
    apiName: 'getWeatherForAlternates';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const getWeatherForAlternates: getWeatherForAlternates;
