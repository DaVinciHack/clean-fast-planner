import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { MainFuelV2 } from '../objects/MainFuelV2.js';
export declare namespace createOrModifyMainFuelFastPlanner {
    type ParamsDefinition = {
        actual_bag_weight: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_fuel_burneds: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_fuel_uplifteds: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_landing_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_leg_names: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'string';
        };
        actual_off_blocks_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_on_blocks_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_passenger_weight: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_passengers: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_take_off_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        actual_total_weight: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        aircraft: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        automation_summary: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        available_passengers: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        available_weight: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        average_bag_weight: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        average_passenger_weight: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        calculation_unit: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        created_at: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'timestamp';
        };
        display_unit: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        flight_number: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        flight_uuid: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        main_fuel_v2: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: ActionMetadata.DataType.Object<MainFuelV2>;
        };
        min_fuel_breakdown: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        min_total_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        passenger_adjustment_data: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        planned_alternate_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_approach_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_ara_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_contingency_alternate_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_contingency_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_deck_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_extra_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_reserve_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_taxi_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        planned_trip_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        policy_name: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        policy_uuid: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        refuel_amounts: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        refuel_stop_indices: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        requested_bag_weight: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        requested_passenger_weight: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        requested_passengers: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        requested_total_weight: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        round_trip_fuel: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        stop_approach_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_ara_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_contingency_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_deck_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_descriptions: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'string';
        };
        stop_excess_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_extra_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_locations: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'string';
        };
        stop_required_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_reserve_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_taxi_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stop_trip_fuels: {
            description: undefined;
            multiplicity: true;
            nullable: false;
            type: 'integer';
        };
        stops_markdown_table: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        total_fuel_burned: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        total_fuel_uplifted: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'integer';
        };
        updated_at: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'timestamp';
        };
        uses_combined_weight: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'boolean';
        };
        weight_balance_data: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
    };
    /**
     * Fast planner updating the fuel object
     */
    interface Params {
        readonly actual_bag_weight: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_fuel_burneds: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_fuel_uplifteds: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_landing_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_leg_names: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly actual_off_blocks_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_on_blocks_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_passenger_weight: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_passengers: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_take_off_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly actual_total_weight: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly aircraft: ActionParam.PrimitiveType<'string'>;
        readonly automation_summary: ActionParam.PrimitiveType<'string'>;
        readonly available_passengers: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly available_weight: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly average_bag_weight: ActionParam.PrimitiveType<'integer'>;
        readonly average_passenger_weight: ActionParam.PrimitiveType<'integer'>;
        readonly calculation_unit: ActionParam.PrimitiveType<'string'>;
        readonly created_at: ActionParam.PrimitiveType<'timestamp'>;
        readonly display_unit: ActionParam.PrimitiveType<'string'>;
        readonly flight_number: ActionParam.PrimitiveType<'string'>;
        readonly flight_uuid: ActionParam.PrimitiveType<'string'>;
        readonly main_fuel_v2: ActionParam.ObjectType<MainFuelV2>;
        readonly min_fuel_breakdown: ActionParam.PrimitiveType<'string'>;
        readonly min_total_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly passenger_adjustment_data: ActionParam.PrimitiveType<'string'>;
        readonly planned_alternate_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_approach_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_ara_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_contingency_alternate_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_contingency_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_deck_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_extra_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_reserve_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_taxi_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly planned_trip_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly policy_name: ActionParam.PrimitiveType<'string'>;
        readonly policy_uuid: ActionParam.PrimitiveType<'string'>;
        readonly refuel_amounts: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly refuel_stop_indices: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly requested_bag_weight: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly requested_passenger_weight: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly requested_passengers: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly requested_total_weight: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly round_trip_fuel: ActionParam.PrimitiveType<'integer'>;
        readonly stop_approach_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_ara_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_contingency_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_deck_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_descriptions: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly stop_excess_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_extra_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_locations: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly stop_required_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_reserve_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_taxi_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stop_trip_fuels: ReadonlyArray<ActionParam.PrimitiveType<'integer'>>;
        readonly stops_markdown_table: ActionParam.PrimitiveType<'string'>;
        readonly total_fuel_burned: ActionParam.PrimitiveType<'integer'>;
        readonly total_fuel_uplifted: ActionParam.PrimitiveType<'integer'>;
        readonly updated_at: ActionParam.PrimitiveType<'timestamp'>;
        readonly uses_combined_weight: ActionParam.PrimitiveType<'boolean'>;
        readonly weight_balance_data: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * Fast planner updating the fuel object
         */
        applyAction<OP extends ApplyActionOptions>(args: createOrModifyMainFuelFastPlanner.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<createOrModifyMainFuelFastPlanner.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Fast planner updating the fuel object
 * @param {ActionParam.PrimitiveType<"integer">} actual_bag_weight
 * @param {ActionParam.PrimitiveType<"integer">} actual_fuel_burneds
 * @param {ActionParam.PrimitiveType<"integer">} actual_fuel_uplifteds
 * @param {ActionParam.PrimitiveType<"integer">} actual_landing_fuels
 * @param {ActionParam.PrimitiveType<"string">} actual_leg_names
 * @param {ActionParam.PrimitiveType<"integer">} actual_off_blocks_fuels
 * @param {ActionParam.PrimitiveType<"integer">} actual_on_blocks_fuels
 * @param {ActionParam.PrimitiveType<"integer">} actual_passenger_weight
 * @param {ActionParam.PrimitiveType<"integer">} actual_passengers
 * @param {ActionParam.PrimitiveType<"integer">} actual_take_off_fuels
 * @param {ActionParam.PrimitiveType<"integer">} actual_total_weight
 * @param {ActionParam.PrimitiveType<"string">} aircraft
 * @param {ActionParam.PrimitiveType<"string">} automation_summary
 * @param {ActionParam.PrimitiveType<"integer">} available_passengers
 * @param {ActionParam.PrimitiveType<"integer">} available_weight
 * @param {ActionParam.PrimitiveType<"integer">} average_bag_weight
 * @param {ActionParam.PrimitiveType<"integer">} average_passenger_weight
 * @param {ActionParam.PrimitiveType<"string">} calculation_unit
 * @param {ActionParam.PrimitiveType<"timestamp">} created_at
 * @param {ActionParam.PrimitiveType<"string">} display_unit
 * @param {ActionParam.PrimitiveType<"string">} flight_number
 * @param {ActionParam.PrimitiveType<"string">} flight_uuid
 * @param {ActionParam.ObjectType<MainFuelV2>} main_fuel_v2
 * @param {ActionParam.PrimitiveType<"string">} min_fuel_breakdown
 * @param {ActionParam.PrimitiveType<"integer">} min_total_fuel
 * @param {ActionParam.PrimitiveType<"string">} passenger_adjustment_data
 * @param {ActionParam.PrimitiveType<"integer">} planned_alternate_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_approach_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_ara_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_contingency_alternate_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_contingency_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_deck_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_extra_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_reserve_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_taxi_fuel
 * @param {ActionParam.PrimitiveType<"integer">} planned_trip_fuel
 * @param {ActionParam.PrimitiveType<"string">} policy_name
 * @param {ActionParam.PrimitiveType<"string">} policy_uuid
 * @param {ActionParam.PrimitiveType<"integer">} refuel_amounts
 * @param {ActionParam.PrimitiveType<"integer">} refuel_stop_indices
 * @param {ActionParam.PrimitiveType<"integer">} requested_bag_weight
 * @param {ActionParam.PrimitiveType<"integer">} requested_passenger_weight
 * @param {ActionParam.PrimitiveType<"integer">} requested_passengers
 * @param {ActionParam.PrimitiveType<"integer">} requested_total_weight
 * @param {ActionParam.PrimitiveType<"integer">} round_trip_fuel
 * @param {ActionParam.PrimitiveType<"integer">} stop_approach_fuels
 * @param {ActionParam.PrimitiveType<"integer">} stop_ara_fuels
 * @param {ActionParam.PrimitiveType<"integer">} stop_contingency_fuels
 * @param {ActionParam.PrimitiveType<"integer">} stop_deck_fuels
 * @param {ActionParam.PrimitiveType<"string">} stop_descriptions
 * @param {ActionParam.PrimitiveType<"integer">} stop_excess_fuels
 * @param {ActionParam.PrimitiveType<"integer">} stop_extra_fuels
 * @param {ActionParam.PrimitiveType<"string">} stop_locations
 * @param {ActionParam.PrimitiveType<"integer">} stop_required_fuels
 * @param {ActionParam.PrimitiveType<"integer">} stop_reserve_fuels
 * @param {ActionParam.PrimitiveType<"integer">} stop_taxi_fuels
 * @param {ActionParam.PrimitiveType<"integer">} stop_trip_fuels
 * @param {ActionParam.PrimitiveType<"string">} stops_markdown_table
 * @param {ActionParam.PrimitiveType<"integer">} total_fuel_burned
 * @param {ActionParam.PrimitiveType<"integer">} total_fuel_uplifted
 * @param {ActionParam.PrimitiveType<"timestamp">} updated_at
 * @param {ActionParam.PrimitiveType<"boolean">} uses_combined_weight
 * @param {ActionParam.PrimitiveType<"string">} weight_balance_data
 */
export interface createOrModifyMainFuelFastPlanner extends ActionDefinition<createOrModifyMainFuelFastPlanner.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'createOrModifyMainFuelFastPlanner';
        description: 'Fast planner updating the fuel object';
        displayName: 'Create or Modify Main Fuel FastPlanner';
        modifiedEntities: {
            MainFuelV2: {
                created: true;
                modified: true;
            };
        };
        parameters: createOrModifyMainFuelFastPlanner.ParamsDefinition;
        rid: 'ri.actions.main.action-type.aa1cf2ae-d61d-410b-bf01-3a4a66fdafa8';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: createOrModifyMainFuelFastPlanner.Signatures;
    };
    apiName: 'createOrModifyMainFuelFastPlanner';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const createOrModifyMainFuelFastPlanner: createOrModifyMainFuelFastPlanner;
