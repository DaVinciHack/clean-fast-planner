import type { ActionDefinition, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
export declare namespace weatherWebookNorwayV9 {
    type ParamsDefinition = {
        icaoCodes: {
            description: undefined;
            multiplicity: false;
            nullable: false;
            type: 'string';
        };
        offset: {
            description: undefined;
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
    };
    interface Params {
        readonly icaoCodes: ActionParam.PrimitiveType<'string'>;
        readonly offset?: ActionParam.PrimitiveType<'string'>;
    }
    interface Signatures {
        applyAction<OP extends ApplyActionOptions>(args: weatherWebookNorwayV9.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<weatherWebookNorwayV9.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * @param {ActionParam.PrimitiveType<"string">} icaoCodes
 * @param {ActionParam.PrimitiveType<"string">} [offset]
 */
export interface weatherWebookNorwayV9 extends ActionDefinition<weatherWebookNorwayV9.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'weatherWebookNorwayV9';
        displayName: 'WeatherWebookNorwayV9';
        modifiedEntities: {};
        parameters: weatherWebookNorwayV9.ParamsDefinition;
        rid: 'ri.actions.main.action-type.9c2ad093-b44a-4e08-9fe1-0893bbc8604b';
        status: 'EXPERIMENTAL';
        type: 'action';
        signatures: weatherWebookNorwayV9.Signatures;
    };
    apiName: 'weatherWebookNorwayV9';
    type: 'action';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const weatherWebookNorwayV9: weatherWebookNorwayV9;
