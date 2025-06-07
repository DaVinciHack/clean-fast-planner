import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace Asset {
    type PropertyKeys = 'fieldbase' | 'dataFrom' | 'acStatus' | 'index' | 'cg' | 'company' | 'cruseSpeed' | 'defaultModel' | 'timeZone' | 'assetIdx' | 'currentVariantId' | 'fuelBurn' | 'lastWeighingDate' | 'dryOperatingWeightLbs' | 'crewCount' | 'melOpLimit' | 'orgName' | 'maxFuelCapacity' | 'acModelName' | 'defaultFuelUnit' | 'orgUnit' | 'regionName' | 'maxPassengers' | 'usefulLoad' | 'dryOperatingMoment' | 'defaultFuelPolicyId' | 'assetIdentifier' | 'defaultWeightUnit' | 'fmsCount' | 'maxCrosswind' | 'defaultDistanceUnit' | 'pilotsIncludedInEmptyWeight' | 'model' | 'acModelIdx';
    type Links = {};
    interface Props {
        readonly acModelIdx: $PropType['string'] | undefined;
        readonly acModelName: $PropType['string'] | undefined;
        readonly acStatus: $PropType['string'] | undefined;
        readonly assetIdentifier: $PropType['string'] | undefined;
        readonly assetIdx: $PropType['string'];
        readonly cg: $PropType['double'] | undefined;
        readonly company: $PropType['string'] | undefined;
        readonly crewCount: $PropType['string'] | undefined;
        readonly cruseSpeed: $PropType['integer'] | undefined;
        readonly currentVariantId: $PropType['string'] | undefined;
        readonly dataFrom: $PropType['string'] | undefined;
        readonly defaultDistanceUnit: $PropType['string'] | undefined;
        readonly defaultFuelPolicyId: $PropType['string'] | undefined;
        readonly defaultFuelUnit: $PropType['string'] | undefined;
        readonly defaultModel: $PropType['string'] | undefined;
        readonly defaultWeightUnit: $PropType['string'] | undefined;
        readonly dryOperatingMoment: $PropType['double'] | undefined;
        readonly dryOperatingWeightLbs: $PropType['double'] | undefined;
        readonly fieldbase: $PropType['string'] | undefined;
        readonly fmsCount: $PropType['integer'] | undefined;
        readonly fuelBurn: $PropType['double'] | undefined;
        readonly index: $PropType['double'] | undefined;
        readonly lastWeighingDate: $PropType['timestamp'] | undefined;
        readonly maxCrosswind: $PropType['integer'] | undefined;
        readonly maxFuelCapacity: $PropType['integer'] | undefined;
        readonly maxPassengers: $PropType['integer'] | undefined;
        readonly melOpLimit: $PropType['string'] | undefined;
        readonly model: $PropType['string'] | undefined;
        readonly orgName: $PropType['string'] | undefined;
        readonly orgUnit: $PropType['string'] | undefined;
        readonly pilotsIncludedInEmptyWeight: $PropType['boolean'] | undefined;
        readonly regionName: $PropType['string'] | undefined;
        readonly timeZone: $PropType['string'] | undefined;
        readonly usefulLoad: $PropType['double'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<Asset, Asset.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof Asset.Props = keyof Asset.Props> = $Osdk.Instance<Asset, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof Asset.Props = keyof Asset.Props> = OsdkInstance<OPTIONS, K>;
}
export interface Asset extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'Asset';
    __DefinitionMetadata?: {
        objectSet: Asset.ObjectSet;
        props: Asset.Props;
        linksType: Asset.Links;
        strictProps: Asset.StrictProps;
        apiName: 'Asset';
        description: '';
        displayName: 'Aircraft Asset';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'helicopter';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Aircraft Assets';
        primaryKeyApiName: 'assetIdx';
        primaryKeyType: 'string';
        properties: {
            /**
             *   display name: 'AC MODEL IDX'
             */
            acModelIdx: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'AC MODEL NAME'
             */
            acModelName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'AC STATUS'
             */
            acStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'ASSET IDENTIFIER'
             */
            assetIdentifier: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'ASSET IDX'
             */
            assetIdx: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             *   display name: 'CG'
             */
            cg: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'COMPANY'
             */
            company: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'CREW COUNT'
             */
            crewCount: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Cruse Speed'
             */
            cruseSpeed: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Current Variant Id'
             */
            currentVariantId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'DATA FROM'
             */
            dataFrom: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Default Distance Unit'
             */
            defaultDistanceUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Default Fuel Policy Id'
             */
            defaultFuelPolicyId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Default Fuel Unit'
             */
            defaultFuelUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'DEFAULT MODEL'
             */
            defaultModel: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Default Weight Unit'
             */
            defaultWeightUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Dry Operating Moment'
             */
            dryOperatingMoment: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Dry Operating Weight Lbs'
             */
            dryOperatingWeightLbs: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'FIELDBASE'
             */
            fieldbase: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            fmsCount: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Fuel Burn'
             */
            fuelBurn: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Index'
             */
            index: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Last Weighing Date'
             */
            lastWeighingDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            maxCrosswind: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'MAX FUEL CAPACITY'
             */
            maxFuelCapacity: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Max Passengers'
             */
            maxPassengers: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'MEL OP LIMIT'
             */
            melOpLimit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'MODEL'
             */
            model: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Org Name'
             */
            orgName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'ORG UNIT'
             */
            orgUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Pilots Included In Empty Weight'
             */
            pilotsIncludedInEmptyWeight: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'REGION NAME'
             */
            regionName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'TIME ZONE'
             */
            timeZone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Useful Load'
             */
            usefulLoad: $PropertyDef<'double', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.c7688575-154d-41ad-a935-f3f9094d45c4';
        status: 'EXPERIMENTAL';
        titleProperty: 'assetIdentifier';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const Asset: Asset;
