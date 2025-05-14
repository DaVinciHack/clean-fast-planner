import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace flightWeatherRiskTriggeredLightningWaves {
    type ParamsDefinition = {
        flightId: {
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * Flight Weather Risk Triggered Lightning Waves
     */
    interface Params {
        readonly flightId: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * Flight Weather Risk Triggered Lightning Waves
         */
        applyAction<P extends flightWeatherRiskTriggeredLightningWaves.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<flightWeatherRiskTriggeredLightningWaves.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Flight Weather Risk Triggered Lightning Waves
 * @param {ActionParam.PrimitiveType<"string">} flightId
 */
export interface flightWeatherRiskTriggeredLightningWaves extends ActionDefinition<flightWeatherRiskTriggeredLightningWaves.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'flightWeatherRiskTriggeredLightningWaves';
        description: 'Flight Weather Risk Triggered Lightning Waves';
        displayName: 'Flight Weather Risk Triggered Lightning Waves';
        modifiedEntities: {};
        parameters: flightWeatherRiskTriggeredLightningWaves.ParamsDefinition;
        rid: 'ri.actions.main.action-type.1209a258-07d8-4a42-a7fc-914d16c94c62';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: flightWeatherRiskTriggeredLightningWaves.Signatures;
    };
    apiName: 'flightWeatherRiskTriggeredLightningWaves';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const flightWeatherRiskTriggeredLightningWaves: flightWeatherRiskTriggeredLightningWaves;
