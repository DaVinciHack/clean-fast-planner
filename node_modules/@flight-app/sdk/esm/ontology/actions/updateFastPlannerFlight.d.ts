import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace updateFastPlannerFlight {
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
        etd: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        flightId: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        flightName: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        fuelPlanId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        locations: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        medicId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        policyUuid: {
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
        structuredWaypoints: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        timingId: {
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
        weightBalanceId: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
    };
    /**
     * updateFastPlannerFlight
     */
    interface Params {
        readonly aircraftId?: ActionParam.PrimitiveType<'string'>;
        readonly aircraftRegion?: ActionParam.PrimitiveType<'string'>;
        readonly alternateLocation?: ActionParam.PrimitiveType<'string'>;
        readonly captainId?: ActionParam.PrimitiveType<'string'>;
        readonly copilotId?: ActionParam.PrimitiveType<'string'>;
        readonly etd?: ActionParam.PrimitiveType<'timestamp'>;
        readonly flightId: ActionParam.PrimitiveType<'string'>;
        readonly flightName?: ActionParam.PrimitiveType<'string'>;
        readonly fuelPlanId?: ActionParam.PrimitiveType<'string'>;
        readonly locations?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly medicId?: ActionParam.PrimitiveType<'string'>;
        readonly policyUuid?: ActionParam.PrimitiveType<'string'>;
        readonly region?: ActionParam.PrimitiveType<'string'>;
        readonly rswId?: ActionParam.PrimitiveType<'string'>;
        readonly soId?: ActionParam.PrimitiveType<'string'>;
        readonly structuredWaypoints?: ActionParam.PrimitiveType<'string'>;
        readonly timingId?: ActionParam.PrimitiveType<'string'>;
        readonly useOnlyProvidedWaypoints?: ActionParam.PrimitiveType<'boolean'>;
        readonly weightBalanceId?: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * updateFastPlannerFlight
         */
        applyAction<OP extends ApplyActionOptions>(args: updateFastPlannerFlight.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<updateFastPlannerFlight.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * updateFastPlannerFlight
 * @param {ActionParam.PrimitiveType<"string">} [aircraftId]
 * @param {ActionParam.PrimitiveType<"string">} [aircraftRegion]
 * @param {ActionParam.PrimitiveType<"string">} [alternateLocation]
 * @param {ActionParam.PrimitiveType<"string">} [captainId]
 * @param {ActionParam.PrimitiveType<"string">} [copilotId]
 * @param {ActionParam.PrimitiveType<"timestamp">} [etd]
 * @param {ActionParam.PrimitiveType<"string">} flightId
 * @param {ActionParam.PrimitiveType<"string">} [flightName]
 * @param {ActionParam.PrimitiveType<"string">} [fuelPlanId]
 * @param {ActionParam.PrimitiveType<"string">} [locations]
 * @param {ActionParam.PrimitiveType<"string">} [medicId]
 * @param {ActionParam.PrimitiveType<"string">} [policyUuid]
 * @param {ActionParam.PrimitiveType<"string">} [region]
 * @param {ActionParam.PrimitiveType<"string">} [rswId]
 * @param {ActionParam.PrimitiveType<"string">} [soId]
 * @param {ActionParam.PrimitiveType<"string">} [structuredWaypoints]
 * @param {ActionParam.PrimitiveType<"string">} [timingId]
 * @param {ActionParam.PrimitiveType<"boolean">} [useOnlyProvidedWaypoints]
 * @param {ActionParam.PrimitiveType<"string">} [weightBalanceId]
 */
export interface updateFastPlannerFlight extends ActionDefinition<updateFastPlannerFlight.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'updateFastPlannerFlight';
        description: 'updateFastPlannerFlight';
        displayName: 'updateFastPlannerFlight';
        modifiedEntities: {};
        parameters: updateFastPlannerFlight.ParamsDefinition;
        rid: 'ri.actions.main.action-type.762d6ccd-c1da-4748-a1c9-3019b9811d77';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: updateFastPlannerFlight.Signatures;
    };
    apiName: 'updateFastPlannerFlight';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const updateFastPlannerFlight: updateFastPlannerFlight;
