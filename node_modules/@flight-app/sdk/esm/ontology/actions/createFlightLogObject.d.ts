import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace createFlightLogObject {
    type ParamsDefinition = {
        additional_crew_ids: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        aircraft_id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        approach_type: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        average_pax_weight: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'integer';
        };
        bags_weight: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        captain_day_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        captain_id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        captain_landings: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        captain_night_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        captain_total_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        comments: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        copilot_day_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        copilot_id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        copilot_landings: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        copilot_night_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        copilot_total_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        delay_reasons: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        device_id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        flight_id: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        flight_number: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        has_pending_changes: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'boolean';
        };
        incident_id: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        initial_fuel_uplifted: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        is_uploaded: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'boolean';
        };
        landing_on: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        last_sync_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        leg_day_minutes: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'integer';
        };
        leg_fuel_uplifted: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'double';
        };
        leg_ids: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        leg_landing_fuel: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'double';
        };
        leg_landing_times: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'timestamp';
        };
        leg_landings: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        leg_names: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        leg_night_minutes: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'integer';
        };
        leg_pilot_flying: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        leg_planned_landing_fuel: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'double';
        };
        leg_planned_landing_times: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'timestamp';
        };
        leg_planned_takeoff_fuel: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'double';
        };
        leg_planned_takeoff_times: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'timestamp';
        };
        leg_takeoff_fuel: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'double';
        };
        leg_takeoff_times: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'timestamp';
        };
        log_date: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        maintenance_notes: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        off_blocks_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        off_blocks_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        on_blocks_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        on_blocks_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'timestamp';
        };
        pax_number: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'integer';
        };
        shutdown_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        startup_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        startup_time: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'timestamp';
        };
        total_bags_pax_weight: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        total_flight_time: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'integer';
        };
        total_fuel_burned: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'double';
        };
        total_pax_weight: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'integer';
        };
        total_time: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        waypoint_actual_fuel: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'double';
        };
        waypoint_actual_times: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        waypoint_names: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
        waypoint_planned_fuel: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'double';
        };
        waypoint_planned_times: {
            description: undefined;
            multiplicity: true;
            nullable: true;
            type: 'string';
        };
    };
    interface Params {
        readonly additional_crew_ids?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly aircraft_id?: ActionParam.PrimitiveType<'string'>;
        readonly approach_type?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly average_pax_weight?: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly bags_weight?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly captain_day_time?: ActionParam.PrimitiveType<'integer'>;
        readonly captain_id?: ActionParam.PrimitiveType<'string'>;
        readonly captain_landings?: ActionParam.PrimitiveType<'integer'>;
        readonly captain_night_time?: ActionParam.PrimitiveType<'integer'>;
        readonly captain_total_time?: ActionParam.PrimitiveType<'integer'>;
        readonly comments?: ActionParam.PrimitiveType<'string'>;
        readonly copilot_day_time?: ActionParam.PrimitiveType<'integer'>;
        readonly copilot_id?: ActionParam.PrimitiveType<'string'>;
        readonly copilot_landings?: ActionParam.PrimitiveType<'integer'>;
        readonly copilot_night_time?: ActionParam.PrimitiveType<'integer'>;
        readonly copilot_total_time?: ActionParam.PrimitiveType<'integer'>;
        readonly delay_reasons?: ActionParam.PrimitiveType<'string'>;
        readonly device_id?: ActionParam.PrimitiveType<'string'>;
        readonly flight_id: ActionParam.PrimitiveType<'string'>;
        readonly flight_number?: ActionParam.PrimitiveType<'string'>;
        readonly has_pending_changes?: ActionParam.PrimitiveType<'boolean'>;
        readonly incident_id?: ActionParam.PrimitiveType<'string'>;
        readonly initial_fuel_uplifted?: ActionParam.PrimitiveType<'double'>;
        readonly is_uploaded?: ActionParam.PrimitiveType<'boolean'>;
        readonly landing_on?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly last_sync_time?: ActionParam.PrimitiveType<'timestamp'>;
        readonly leg_day_minutes?: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly leg_fuel_uplifted?: ReadonlyArray<ActionParam.PrimitiveType<'double'>>;
        readonly leg_ids?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly leg_landing_fuel?: ReadonlyArray<ActionParam.PrimitiveType<'double'>>;
        readonly leg_landing_times?: ReadonlyArray<ActionParam.PrimitiveType<'timestamp'>>;
        readonly leg_landings?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly leg_names?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly leg_night_minutes?: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly leg_pilot_flying?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly leg_planned_landing_fuel?: ReadonlyArray<ActionParam.PrimitiveType<'double'>>;
        readonly leg_planned_landing_times?: ReadonlyArray<ActionParam.PrimitiveType<'timestamp'>>;
        readonly leg_planned_takeoff_fuel?: ReadonlyArray<ActionParam.PrimitiveType<'double'>>;
        readonly leg_planned_takeoff_times?: ReadonlyArray<ActionParam.PrimitiveType<'timestamp'>>;
        readonly leg_takeoff_fuel?: ReadonlyArray<ActionParam.PrimitiveType<'double'>>;
        readonly leg_takeoff_times?: ReadonlyArray<ActionParam.PrimitiveType<'timestamp'>>;
        readonly log_date?: ActionParam.PrimitiveType<'timestamp'>;
        readonly maintenance_notes?: ActionParam.PrimitiveType<'string'>;
        readonly off_blocks_fuel?: ActionParam.PrimitiveType<'double'>;
        readonly off_blocks_time?: ActionParam.PrimitiveType<'timestamp'>;
        readonly on_blocks_fuel?: ActionParam.PrimitiveType<'double'>;
        readonly on_blocks_time?: ActionParam.PrimitiveType<'timestamp'>;
        readonly pax_number?: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly shutdown_fuel?: ActionParam.PrimitiveType<'double'>;
        readonly startup_fuel?: ActionParam.PrimitiveType<'double'>;
        readonly startup_time: ActionParam.PrimitiveType<'timestamp'>;
        readonly total_bags_pax_weight?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly total_flight_time?: ActionParam.PrimitiveType<'integer'>;
        readonly total_fuel_burned?: ActionParam.PrimitiveType<'double'>;
        readonly total_pax_weight?: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly total_time: ActionParam.PrimitiveType<'integer'>;
        readonly waypoint_actual_fuel?: ReadonlyArray<ActionParam.PrimitiveType<'double'>>;
        readonly waypoint_actual_times?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly waypoint_names?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly waypoint_planned_fuel?: ReadonlyArray<ActionParam.PrimitiveType<'double'>>;
        readonly waypoint_planned_times?: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
    }
    interface Signatures {
        applyAction<OP extends ApplyActionOptions>(args: createFlightLogObject.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<createFlightLogObject.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * @param {ActionParam.PrimitiveType<"string">} [additional_crew_ids]
 * @param {ActionParam.PrimitiveType<"string">} [aircraft_id]
 * @param {ActionParam.PrimitiveType<"string">} [approach_type]
 * @param {ActionParam.PrimitiveType<"integer">} [average_pax_weight]
 * @param {ActionParam.PrimitiveType<"string">} [bags_weight]
 * @param {ActionParam.PrimitiveType<"integer">} [captain_day_time]
 * @param {ActionParam.PrimitiveType<"string">} [captain_id]
 * @param {ActionParam.PrimitiveType<"integer">} [captain_landings]
 * @param {ActionParam.PrimitiveType<"integer">} [captain_night_time]
 * @param {ActionParam.PrimitiveType<"integer">} [captain_total_time]
 * @param {ActionParam.PrimitiveType<"string">} [comments]
 * @param {ActionParam.PrimitiveType<"integer">} [copilot_day_time]
 * @param {ActionParam.PrimitiveType<"string">} [copilot_id]
 * @param {ActionParam.PrimitiveType<"integer">} [copilot_landings]
 * @param {ActionParam.PrimitiveType<"integer">} [copilot_night_time]
 * @param {ActionParam.PrimitiveType<"integer">} [copilot_total_time]
 * @param {ActionParam.PrimitiveType<"string">} [delay_reasons]
 * @param {ActionParam.PrimitiveType<"string">} [device_id]
 * @param {ActionParam.PrimitiveType<"string">} flight_id
 * @param {ActionParam.PrimitiveType<"string">} [flight_number]
 * @param {ActionParam.PrimitiveType<"boolean">} [has_pending_changes]
 * @param {ActionParam.PrimitiveType<"string">} [incident_id]
 * @param {ActionParam.PrimitiveType<"double">} [initial_fuel_uplifted]
 * @param {ActionParam.PrimitiveType<"boolean">} [is_uploaded]
 * @param {ActionParam.PrimitiveType<"string">} [landing_on]
 * @param {ActionParam.PrimitiveType<"timestamp">} [last_sync_time]
 * @param {ActionParam.PrimitiveType<"integer">} [leg_day_minutes]
 * @param {ActionParam.PrimitiveType<"double">} [leg_fuel_uplifted]
 * @param {ActionParam.PrimitiveType<"string">} [leg_ids]
 * @param {ActionParam.PrimitiveType<"double">} [leg_landing_fuel]
 * @param {ActionParam.PrimitiveType<"timestamp">} [leg_landing_times]
 * @param {ActionParam.PrimitiveType<"string">} [leg_landings]
 * @param {ActionParam.PrimitiveType<"string">} [leg_names]
 * @param {ActionParam.PrimitiveType<"integer">} [leg_night_minutes]
 * @param {ActionParam.PrimitiveType<"string">} [leg_pilot_flying]
 * @param {ActionParam.PrimitiveType<"double">} [leg_planned_landing_fuel]
 * @param {ActionParam.PrimitiveType<"timestamp">} [leg_planned_landing_times]
 * @param {ActionParam.PrimitiveType<"double">} [leg_planned_takeoff_fuel]
 * @param {ActionParam.PrimitiveType<"timestamp">} [leg_planned_takeoff_times]
 * @param {ActionParam.PrimitiveType<"double">} [leg_takeoff_fuel]
 * @param {ActionParam.PrimitiveType<"timestamp">} [leg_takeoff_times]
 * @param {ActionParam.PrimitiveType<"timestamp">} [log_date]
 * @param {ActionParam.PrimitiveType<"string">} [maintenance_notes]
 * @param {ActionParam.PrimitiveType<"double">} [off_blocks_fuel]
 * @param {ActionParam.PrimitiveType<"timestamp">} [off_blocks_time]
 * @param {ActionParam.PrimitiveType<"double">} [on_blocks_fuel]
 * @param {ActionParam.PrimitiveType<"timestamp">} [on_blocks_time]
 * @param {ActionParam.PrimitiveType<"integer">} [pax_number]
 * @param {ActionParam.PrimitiveType<"double">} [shutdown_fuel]
 * @param {ActionParam.PrimitiveType<"double">} [startup_fuel]
 * @param {ActionParam.PrimitiveType<"timestamp">} startup_time
 * @param {ActionParam.PrimitiveType<"string">} [total_bags_pax_weight]
 * @param {ActionParam.PrimitiveType<"integer">} [total_flight_time]
 * @param {ActionParam.PrimitiveType<"double">} [total_fuel_burned]
 * @param {ActionParam.PrimitiveType<"integer">} [total_pax_weight]
 * @param {ActionParam.PrimitiveType<"integer">} total_time
 * @param {ActionParam.PrimitiveType<"double">} [waypoint_actual_fuel]
 * @param {ActionParam.PrimitiveType<"string">} [waypoint_actual_times]
 * @param {ActionParam.PrimitiveType<"string">} [waypoint_names]
 * @param {ActionParam.PrimitiveType<"double">} [waypoint_planned_fuel]
 * @param {ActionParam.PrimitiveType<"string">} [waypoint_planned_times]
 */
export interface createFlightLogObject extends ActionDefinition<createFlightLogObject.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'createFlightLogObject';
        displayName: 'Create Flight Log Object';
        modifiedEntities: {
            FlightLogObject: {
                created: true;
                modified: false;
            };
        };
        parameters: createFlightLogObject.ParamsDefinition;
        rid: 'ri.actions.main.action-type.1b93f2b3-28c2-45cd-80eb-a85ac0e7b88c';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: createFlightLogObject.Signatures;
    };
    apiName: 'createFlightLogObject';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const createFlightLogObject: createFlightLogObject;
