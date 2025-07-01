import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { AllGtLocationsV2 } from '../objects/AllGtLocationsV2.js';
export declare namespace buildNewGtLocationsV2 {
    type ParamsDefinition = {
        active_site: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        AllGtLocation: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: ActionMetadata.DataType.Object<AllGtLocationsV2>;
        };
        customer_alias: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        data_from: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        fuel_available: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        fuel_owner: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        geo_point: {
            description: 'This has to be in this format,    -25.47139,-43.99222';
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        isairport: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        isbase: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        last_update_date: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        lat: {
            description: 'Has to be in this formate,   -25.47139';
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        loc_alias: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        loc_name: {
            description: '4 Letter code';
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        location_cd: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        location_description: {
            description: 'Full Name';
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        location_notes: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        location_radio_notes: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        location_type: {
            description: 'Fixed Platform, Movable, Base, Airport, Ship';
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        lon: {
            description: 'Has to be in this format,   -60.38229';
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        lrm_region_id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        primary_phone: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        primary_radio: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        reference_id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        region: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        route_direction: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        secondary_phone: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        time_zone: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        timezone_offset: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
    };
    /**
     * Building new GT locations for the map
     */
    interface Params {
        readonly active_site?: ActionParam.PrimitiveType<'string'>;
        readonly AllGtLocation?: ActionParam.ObjectType<AllGtLocationsV2>;
        readonly customer_alias?: ActionParam.PrimitiveType<'string'>;
        readonly data_from?: ActionParam.PrimitiveType<'string'>;
        readonly fuel_available?: ActionParam.PrimitiveType<'string'>;
        readonly fuel_owner?: ActionParam.PrimitiveType<'string'>;
        /**
         * This has to be in this format,    -25.47139,-43.99222
         */
        readonly geo_point: ActionParam.PrimitiveType<'string'>;
        readonly id?: ActionParam.PrimitiveType<'string'>;
        readonly isairport?: ActionParam.PrimitiveType<'string'>;
        readonly isbase?: ActionParam.PrimitiveType<'string'>;
        readonly last_update_date?: ActionParam.PrimitiveType<'timestamp'>;
        /**
         * Has to be in this formate,   -25.47139
         */
        readonly lat?: ActionParam.PrimitiveType<'double'>;
        readonly loc_alias?: ActionParam.PrimitiveType<'string'>;
        /**
         * 4 Letter code
         */
        readonly loc_name: ActionParam.PrimitiveType<'string'>;
        readonly location_cd?: ActionParam.PrimitiveType<'string'>;
        /**
         * Full Name
         */
        readonly location_description: ActionParam.PrimitiveType<'string'>;
        readonly location_notes?: ActionParam.PrimitiveType<'string'>;
        readonly location_radio_notes?: ActionParam.PrimitiveType<'string'>;
        /**
         * Fixed Platform, Movable, Base, Airport, Ship
         */
        readonly location_type?: ActionParam.PrimitiveType<'string'>;
        /**
         * Has to be in this format,   -60.38229
         */
        readonly lon?: ActionParam.PrimitiveType<'double'>;
        readonly lrm_region_id?: ActionParam.PrimitiveType<'integer'>;
        readonly primary_phone?: ActionParam.PrimitiveType<'string'>;
        readonly primary_radio?: ActionParam.PrimitiveType<'string'>;
        readonly reference_id?: ActionParam.PrimitiveType<'integer'>;
        readonly region?: ActionParam.PrimitiveType<'string'>;
        readonly route_direction?: ActionParam.PrimitiveType<'string'>;
        readonly secondary_phone?: ActionParam.PrimitiveType<'string'>;
        readonly time_zone?: ActionParam.PrimitiveType<'string'>;
        readonly timezone_offset?: ActionParam.PrimitiveType<'double'>;
    }
    interface Signatures {
        /**
         * Building new GT locations for the map
         */
        applyAction<OP extends ApplyActionOptions>(args: buildNewGtLocationsV2.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<buildNewGtLocationsV2.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Building new GT locations for the map
 * @param {ActionParam.PrimitiveType<"string">} [active_site]
 * @param {ActionParam.ObjectType<AllGtLocationsV2>} [AllGtLocation]
 * @param {ActionParam.PrimitiveType<"string">} [customer_alias]
 * @param {ActionParam.PrimitiveType<"string">} [data_from]
 * @param {ActionParam.PrimitiveType<"string">} [fuel_available]
 * @param {ActionParam.PrimitiveType<"string">} [fuel_owner]
 * @param {ActionParam.PrimitiveType<"string">} geo_point This has to be in this format,    -25.47139,-43.99222
 * @param {ActionParam.PrimitiveType<"string">} [id]
 * @param {ActionParam.PrimitiveType<"string">} [isairport]
 * @param {ActionParam.PrimitiveType<"string">} [isbase]
 * @param {ActionParam.PrimitiveType<"timestamp">} [last_update_date]
 * @param {ActionParam.PrimitiveType<"double">} [lat] Has to be in this formate,   -25.47139
 * @param {ActionParam.PrimitiveType<"string">} [loc_alias]
 * @param {ActionParam.PrimitiveType<"string">} loc_name 4 Letter code
 * @param {ActionParam.PrimitiveType<"string">} [location_cd]
 * @param {ActionParam.PrimitiveType<"string">} location_description Full Name
 * @param {ActionParam.PrimitiveType<"string">} [location_notes]
 * @param {ActionParam.PrimitiveType<"string">} [location_radio_notes]
 * @param {ActionParam.PrimitiveType<"string">} [location_type] Fixed Platform, Movable, Base, Airport, Ship
 * @param {ActionParam.PrimitiveType<"double">} [lon] Has to be in this format,   -60.38229
 * @param {ActionParam.PrimitiveType<"integer">} [lrm_region_id]
 * @param {ActionParam.PrimitiveType<"string">} [primary_phone]
 * @param {ActionParam.PrimitiveType<"string">} [primary_radio]
 * @param {ActionParam.PrimitiveType<"integer">} [reference_id]
 * @param {ActionParam.PrimitiveType<"string">} [region]
 * @param {ActionParam.PrimitiveType<"string">} [route_direction]
 * @param {ActionParam.PrimitiveType<"string">} [secondary_phone]
 * @param {ActionParam.PrimitiveType<"string">} [time_zone]
 * @param {ActionParam.PrimitiveType<"double">} [timezone_offset]
 */
export interface buildNewGtLocationsV2 extends ActionDefinition<buildNewGtLocationsV2.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'buildNewGtLocationsV2';
        description: 'Building new GT locations for the map';
        displayName: 'Build new GT Locations V2';
        modifiedEntities: {
            AllGtLocationsV2: {
                created: true;
                modified: false;
            };
        };
        parameters: buildNewGtLocationsV2.ParamsDefinition;
        rid: 'ri.actions.main.action-type.5bd14935-a136-4d95-9580-f6c1805e4b90';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: buildNewGtLocationsV2.Signatures;
    };
    apiName: 'buildNewGtLocationsV2';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const buildNewGtLocationsV2: buildNewGtLocationsV2;
