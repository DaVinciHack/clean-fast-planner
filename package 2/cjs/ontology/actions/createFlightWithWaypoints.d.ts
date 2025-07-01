import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace createFlightWithWaypoints {
    type ParamsDefinition = {
        aircraftId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        aircraftRegion: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        alternateLocation: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        captainId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        copilotId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        displayWaypoints: {
            description: undefined;
            multiplicity: false;
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
        legs: {
            description: undefined;
            multiplicity: false;
            nullable: true;
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
            type: 'string';
        };
        soId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        useOnlyProvidedWaypoints: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'boolean';
        };
    };
    /**
     * createFlightWithWaypoints
     */
    interface Params {
        readonly aircraftId?: ActionParam.PrimitiveType<'string'>;
        readonly aircraftRegion?: ActionParam.PrimitiveType<'string'>;
        readonly alternateLocation?: ActionParam.PrimitiveType<'string'>;
        readonly captainId?: ActionParam.PrimitiveType<'string'>;
        readonly copilotId?: ActionParam.PrimitiveType<'string'>;
        readonly displayWaypoints?: ActionParam.PrimitiveType<'string'>;
        readonly etd?: ActionParam.PrimitiveType<'timestamp'>;
        readonly flightName: ActionParam.PrimitiveType<'string'>;
        readonly legs?: ActionParam.PrimitiveType<'string'>;
        readonly locations: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly medicId?: ActionParam.PrimitiveType<'string'>;
        readonly region?: ActionParam.PrimitiveType<'string'>;
        readonly rswId?: ActionParam.PrimitiveType<'string'>;
        readonly soId?: ActionParam.PrimitiveType<'string'>;
        readonly useOnlyProvidedWaypoints?: ActionParam.PrimitiveType<'boolean'>;
    }
    interface Signatures {
        /**
         * createFlightWithWaypoints
         */
        applyAction<OP extends ApplyActionOptions>(args: createFlightWithWaypoints.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<createFlightWithWaypoints.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * createFlightWithWaypoints
 * @param {ActionParam.PrimitiveType<"string">} [aircraftId]
 * @param {ActionParam.PrimitiveType<"string">} [aircraftRegion]
 * @param {ActionParam.PrimitiveType<"string">} [alternateLocation]
 * @param {ActionParam.PrimitiveType<"string">} [captainId]
 * @param {ActionParam.PrimitiveType<"string">} [copilotId]
 * @param {ActionParam.PrimitiveType<"string">} [displayWaypoints]
 * @param {ActionParam.PrimitiveType<"timestamp">} [etd]
 * @param {ActionParam.PrimitiveType<"string">} flightName
 * @param {ActionParam.PrimitiveType<"string">} [legs]
 * @param {ActionParam.PrimitiveType<"string">} locations
 * @param {ActionParam.PrimitiveType<"string">} [medicId]
 * @param {ActionParam.PrimitiveType<"string">} [region]
 * @param {ActionParam.PrimitiveType<"string">} [rswId]
 * @param {ActionParam.PrimitiveType<"string">} [soId]
 * @param {ActionParam.PrimitiveType<"boolean">} [useOnlyProvidedWaypoints]
 */
export interface createFlightWithWaypoints extends ActionDefinition<createFlightWithWaypoints.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'createFlightWithWaypoints';
        description: 'createFlightWithWaypoints';
        displayName: 'createFlightWithWaypoints';
        modifiedEntities: {};
        parameters: createFlightWithWaypoints.ParamsDefinition;
        rid: 'ri.actions.main.action-type.544553d2-9cc6-44c8-bdf9-a6f4d049a32b';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: createFlightWithWaypoints.Signatures;
    };
    apiName: 'createFlightWithWaypoints';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const createFlightWithWaypoints: createFlightWithWaypoints;
