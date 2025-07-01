import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace updateAlternantOneStep {
    type ParamsDefinition = {
        alternateLocation: {
            description: 'Leave the to location blank to auto find the nearest alternant  with weather.';
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        flightId: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        splitPointLocation: {
            description: 'Any location or the destination on the flight';
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * Updates the alternate and re calculates fuel and timing
     */
    interface Params {
        /**
         * Leave the to location blank to auto find the nearest alternant  with weather.
         */
        readonly alternateLocation?: ActionParam.PrimitiveType<'string'>;
        readonly flightId: ActionParam.PrimitiveType<'string'>;
        /**
         * Any location or the destination on the flight
         */
        readonly splitPointLocation: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * Updates the alternate and re calculates fuel and timing
         */
        applyAction<OP extends ApplyActionOptions>(args: updateAlternantOneStep.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<updateAlternantOneStep.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Updates the alternate and re calculates fuel and timing
 * @param {ActionParam.PrimitiveType<"string">} [alternateLocation] Leave the to location blank to auto find the nearest alternant  with weather.
 * @param {ActionParam.PrimitiveType<"string">} flightId
 * @param {ActionParam.PrimitiveType<"string">} splitPointLocation Any location or the destination on the flight
 */
export interface updateAlternantOneStep extends ActionDefinition<updateAlternantOneStep.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'updateAlternantOneStep';
        description: 'Updates the alternate and re calculates fuel and timing';
        displayName: 'Update Alternant one step';
        modifiedEntities: {};
        parameters: updateAlternantOneStep.ParamsDefinition;
        rid: 'ri.actions.main.action-type.18acb930-19db-4b79-992a-3cceab5e7ebf';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: updateAlternantOneStep.Signatures;
    };
    apiName: 'updateAlternantOneStep';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const updateAlternantOneStep: updateAlternantOneStep;
