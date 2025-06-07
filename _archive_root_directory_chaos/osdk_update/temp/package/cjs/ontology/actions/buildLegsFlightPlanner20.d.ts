import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace buildLegsFlightPlanner20 {
    type ParamsDefinition = {
        bearingThreshold: {
            multiplicity: false;
            nullable: false;
            type: 'double';
        };
        corridorWidth: {
            multiplicity: false;
            nullable: false;
            type: 'double';
        };
        isAlternate: {
            multiplicity: false;
            nullable: false;
            type: 'boolean';
        };
        locationNames: {
            multiplicity: true;
            nullable: false;
            type: 'string';
        };
        maxDist: {
            multiplicity: false;
            nullable: false;
            type: 'double';
        };
        minDist: {
            multiplicity: false;
            nullable: false;
            type: 'double';
        };
        region: {
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
    };
    /**
     * This will take an array of waypoints and build a leg
     */
    interface Params {
        readonly bearingThreshold: ActionParam.PrimitiveType<'double'>;
        readonly corridorWidth: ActionParam.PrimitiveType<'double'>;
        readonly isAlternate: ActionParam.PrimitiveType<'boolean'>;
        readonly locationNames: ReadonlyArray<ActionParam.PrimitiveType<'string'>>;
        readonly maxDist: ActionParam.PrimitiveType<'double'>;
        readonly minDist: ActionParam.PrimitiveType<'double'>;
        readonly region?: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        /**
         * This will take an array of waypoints and build a leg
         */
        applyAction<P extends buildLegsFlightPlanner20.Params, OP extends ApplyActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<P extends ReadonlyArray<buildLegsFlightPlanner20.Params>, OP extends ApplyBatchActionOptions>(args: P, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * This will take an array of waypoints and build a leg
 * @param {ActionParam.PrimitiveType<"double">} bearingThreshold
 * @param {ActionParam.PrimitiveType<"double">} corridorWidth
 * @param {ActionParam.PrimitiveType<"boolean">} isAlternate
 * @param {ActionParam.PrimitiveType<"string">} locationNames
 * @param {ActionParam.PrimitiveType<"double">} maxDist
 * @param {ActionParam.PrimitiveType<"double">} minDist
 * @param {ActionParam.PrimitiveType<"string">} [region]
 */
export interface buildLegsFlightPlanner20 extends ActionDefinition<buildLegsFlightPlanner20.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'buildLegsFlightPlanner20';
        description: 'This will take an array of waypoints and build a leg';
        displayName: 'Build legs Flight Planner 2.0';
        modifiedEntities: {};
        parameters: buildLegsFlightPlanner20.ParamsDefinition;
        rid: 'ri.actions.main.action-type.265e8c76-0779-44f4-a48f-0aedbf3fd88c';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: buildLegsFlightPlanner20.Signatures;
    };
    apiName: 'buildLegsFlightPlanner20';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const buildLegsFlightPlanner20: buildLegsFlightPlanner20;
