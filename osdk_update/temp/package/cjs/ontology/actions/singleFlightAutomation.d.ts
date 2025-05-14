import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace singleFlightAutomation {
    type ParamsDefinition = {
        flightId: {
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * Single flight automation
     */
    interface Params {
        readonly flightId: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * Single flight automation
         */
        applyAction<P extends singleFlightAutomation.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<singleFlightAutomation.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Single flight automation
 * @param {ActionParam.PrimitiveType<"string">} flightId
 */
export interface singleFlightAutomation extends ActionDefinition<singleFlightAutomation.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'singleFlightAutomation';
        description: 'Single flight automation';
        displayName: 'Single flight automation';
        modifiedEntities: {};
        parameters: singleFlightAutomation.ParamsDefinition;
        rid: 'ri.actions.main.action-type.8159989a-c109-4b3d-a744-d9924b9ff300';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: singleFlightAutomation.Signatures;
    };
    apiName: 'singleFlightAutomation';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const singleFlightAutomation: singleFlightAutomation;
