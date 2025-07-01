import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { User } from '../objects/User.js';
import type { Asset } from '../objects/Asset.js';
export declare namespace createNewFlightFp2 {
    type ParamsDefinition = {
        aircraftId: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: ActionMetadata.DataType.Object<Asset>;
        };
        aircraftRegion: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        alternateLocation: {
            description: 'Will find best alternate for if left blank';
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        asset_idx: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        captainId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: ActionMetadata.DataType.Object<User>;
        };
        copilotId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: ActionMetadata.DataType.Object<User>;
        };
        displayWaypoints: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        etd: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        flightName: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        locations: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'string';
        };
        medicId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: ActionMetadata.DataType.Object<User>;
        };
        new_parameter: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        region: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        rswId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: ActionMetadata.DataType.Object<User>;
        };
        soId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: ActionMetadata.DataType.Object<User>;
        };
        useDirectRoutes: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'boolean';
        };
    };
    /**
     * Creates a new flight for FP2.0
     */
    interface Params {
        readonly aircraftId: ActionParam.ObjectType<Asset>;
        readonly aircraftRegion?: ActionParam.PrimitiveType<'string'>;
        /**
         * Will find best alternate for if left blank
         */
        readonly alternateLocation?: ActionParam.PrimitiveType<'string'>;
        readonly asset_idx: ActionParam.PrimitiveType<'string'>;
        readonly captainId?: ActionParam.ObjectType<User>;
        readonly copilotId?: ActionParam.ObjectType<User>;
        readonly displayWaypoints?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly etd?: ActionParam.PrimitiveType<'timestamp'>;
        readonly flightName: ActionParam.PrimitiveType<'string'>;
        readonly locations: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly medicId?: ActionParam.ObjectType<User>;
        readonly new_parameter?: ActionParam.PrimitiveType<'string'>;
        readonly region?: ActionParam.PrimitiveType<'string'>;
        readonly rswId?: ActionParam.ObjectType<User>;
        readonly soId?: ActionParam.ObjectType<User>;
        readonly useDirectRoutes?: ActionParam.PrimitiveType<'boolean'>;
    }
    interface Signatures {
        /**
         * Creates a new flight for FP2.0
         */
        applyAction<OP extends ApplyActionOptions>(args: createNewFlightFp2.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<createNewFlightFp2.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Creates a new flight for FP2.0
 * @param {ActionParam.ObjectType<Asset>} aircraftId
 * @param {ActionParam.PrimitiveType<"string">} [aircraftRegion]
 * @param {ActionParam.PrimitiveType<"string">} [alternateLocation] Will find best alternate for if left blank
 * @param {ActionParam.PrimitiveType<"string">} asset_idx
 * @param {ActionParam.ObjectType<User>} [captainId]
 * @param {ActionParam.ObjectType<User>} [copilotId]
 * @param {ActionParam.PrimitiveType<"string">} [displayWaypoints]
 * @param {ActionParam.PrimitiveType<"timestamp">} [etd]
 * @param {ActionParam.PrimitiveType<"string">} flightName
 * @param {ActionParam.PrimitiveType<"string">} locations
 * @param {ActionParam.ObjectType<User>} [medicId]
 * @param {ActionParam.PrimitiveType<"string">} [new_parameter]
 * @param {ActionParam.PrimitiveType<"string">} [region]
 * @param {ActionParam.ObjectType<User>} [rswId]
 * @param {ActionParam.ObjectType<User>} [soId]
 * @param {ActionParam.PrimitiveType<"boolean">} [useDirectRoutes]
 */
export interface createNewFlightFp2 extends ActionDefinition<createNewFlightFp2.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'createNewFlightFp2';
        description: 'Creates a new flight for FP2.0';
        displayName: 'Create New Flight FP2';
        modifiedEntities: {};
        parameters: createNewFlightFp2.ParamsDefinition;
        rid: 'ri.actions.main.action-type.cde0645b-8f27-4547-b74d-6eaa8ffb8581';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: createNewFlightFp2.Signatures;
    };
    apiName: 'createNewFlightFp2';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const createNewFlightFp2: createNewFlightFp2;
