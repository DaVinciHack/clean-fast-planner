import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { AllGtLocationsV2 } from '../objects/AllGtLocationsV2.js';
export declare namespace deleteLocationAllgtlocationsV2 {
    type ParamsDefinition = {
        AllGtLocationsV2: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: ActionMetadata.DataType.Object<AllGtLocationsV2>;
        };
    };
    /**
     * Delate a Location from AllLocationsV2
     */
    interface Params {
        readonly AllGtLocationsV2: ActionParam.ObjectType<AllGtLocationsV2>;
    }
    interface Signatures {
        /**
         * Delate a Location from AllLocationsV2
         */
        applyAction<OP extends ApplyActionOptions>(args: deleteLocationAllgtlocationsV2.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<deleteLocationAllgtlocationsV2.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Delate a Location from AllLocationsV2
 * @param {ActionParam.ObjectType<AllGtLocationsV2>} AllGtLocationsV2
 */
export interface deleteLocationAllgtlocationsV2 extends ActionDefinition<deleteLocationAllgtlocationsV2.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'deleteLocationAllgtlocationsV2';
        description: 'Delate a Location from AllLocationsV2';
        displayName: 'Delete Location ALLGTLocationsV2';
        modifiedEntities: {};
        parameters: deleteLocationAllgtlocationsV2.ParamsDefinition;
        rid: 'ri.actions.main.action-type.8c373b87-2698-4d56-a072-8385217a752b';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: deleteLocationAllgtlocationsV2.Signatures;
    };
    apiName: 'deleteLocationAllgtlocationsV2';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const deleteLocationAllgtlocationsV2: deleteLocationAllgtlocationsV2;
