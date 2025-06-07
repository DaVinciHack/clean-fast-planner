import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { MainFlightObjectFp2 } from '../objects/MainFlightObjectFp2.js';
export declare namespace flightAppUpdateEtdAndCrew {
    type ParamsDefinition = {
        captain: {
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        copilot: {
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        etd: {
            multiplicity: false;
            nullable: false;
            type: 'timestamp';
        };
        main_flight_object_fp2: {
            multiplicity: false;
            nullable: false;
            type: ActionMetadata.DataType.Object<MainFlightObjectFp2>;
        };
    };
    /**
     * Simple action to update departure time and the crew
     */
    interface Params {
        readonly captain?: ActionParam.PrimitiveType<'string'>;
        readonly copilot?: ActionParam.PrimitiveType<'string'>;
        readonly etd: ActionParam.PrimitiveType<'timestamp'>;
        readonly main_flight_object_fp2: ActionParam.ObjectType<MainFlightObjectFp2>;
    }
    interface Signatures {
        /**
         * Simple action to update departure time and the crew
         */
        applyAction<P extends flightAppUpdateEtdAndCrew.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<flightAppUpdateEtdAndCrew.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Simple action to update departure time and the crew
 * @param {ActionParam.PrimitiveType<"string">} [captain]
 * @param {ActionParam.PrimitiveType<"string">} [copilot]
 * @param {ActionParam.PrimitiveType<"timestamp">} etd
 * @param {ActionParam.ObjectType<MainFlightObjectFp2>} main_flight_object_fp2
 */
export interface flightAppUpdateEtdAndCrew extends ActionDefinition<flightAppUpdateEtdAndCrew.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'flightAppUpdateEtdAndCrew';
        description: 'Simple action to update departure time and the crew';
        displayName: 'FlightApp update ETD and crew';
        modifiedEntities: {
            MainFlightObjectFp2: {
                created: false;
                modified: true;
            };
        };
        parameters: flightAppUpdateEtdAndCrew.ParamsDefinition;
        rid: 'ri.actions.main.action-type.774824af-c7a4-470e-bf3a-eb20d0ad6661';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: flightAppUpdateEtdAndCrew.Signatures;
    };
    apiName: 'flightAppUpdateEtdAndCrew';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const flightAppUpdateEtdAndCrew: flightAppUpdateEtdAndCrew;
