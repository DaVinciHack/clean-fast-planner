import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace Asset {
    type PropertyKeys = 'fieldbase' | 'dataFrom' | 'flatPitchFuelBurnDeckFuel' | 'acStatus' | 'index' | 'cg' | 'company' | 'cruseSpeed' | 'defaultModel' | 'timeZone' | 'assetIdx' | 'currentVariantId' | 'fuelBurn' | 'lastWeighingDate' | 'dryOperatingWeightLbs' | 'crewCount' | 'melOpLimit' | 'orgName' | 'maxFuelCapacity' | 'acModelName' | 'defaultFuelUnit' | 'maxPassengers' | 'orgUnit' | 'regionName' | 'usefulLoad' | 'dryOperatingMoment' | 'defaultFuelPolicyId' | 'assetIdentifier' | 'defaultWeightUnit' | 'fmsCount' | 'maxCrosswind' | 'defaultDistanceUnit' | 'pilotsIncludedInEmptyWeight' | 'defaultFuelPolicyName' | 'model' | 'acModelIdx';
    type Links = {};
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'AC MODEL IDX'
         */
        readonly acModelIdx: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'AC MODEL NAME'
         */
        readonly acModelName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'AC STATUS'
         */
        readonly acStatus: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'ASSET IDENTIFIER'
         */
        readonly assetIdentifier: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'ASSET IDX'
         */
        readonly assetIdx: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'CG'
         */
        readonly cg: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'COMPANY'
         */
        readonly company: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'CREW COUNT'
         */
        readonly crewCount: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cruse Speed'
         */
        readonly cruseSpeed: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Current Variant Id'
         */
        readonly currentVariantId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'DATA FROM'
         */
        readonly dataFrom: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Default Distance Unit'
         */
        readonly defaultDistanceUnit: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Default Fuel Policy Id'
         */
        readonly defaultFuelPolicyId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Default Fuel Policy Name'
         */
        readonly defaultFuelPolicyName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Default Fuel Unit'
         */
        readonly defaultFuelUnit: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'DEFAULT MODEL'
         */
        readonly defaultModel: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Default Weight Unit'
         */
        readonly defaultWeightUnit: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Dry Operating Moment'
         */
        readonly dryOperatingMoment: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Dry Operating Weight Lbs'
         */
        readonly dryOperatingWeightLbs: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'FIELDBASE'
         */
        readonly fieldbase: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Flat Pitch Fuel Burn(Deck fuel)'
         */
        readonly flatPitchFuelBurnDeckFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly fmsCount: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Fuel Burn'
         */
        readonly fuelBurn: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Index'
         */
        readonly index: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Last Weighing Date'
         */
        readonly lastWeighingDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly maxCrosswind: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'MAX FUEL CAPACITY'
         */
        readonly maxFuelCapacity: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Max Passengers'
         */
        readonly maxPassengers: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'MEL OP LIMIT'
         */
        readonly melOpLimit: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'MODEL'
         */
        readonly model: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Org Name'
         */
        readonly orgName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'ORG UNIT'
         */
        readonly orgUnit: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Pilots Included In Empty Weight'
         */
        readonly pilotsIncludedInEmptyWeight: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'REGION NAME'
         */
        readonly regionName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'TIME ZONE'
         */
        readonly timeZone: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Useful Load'
         */
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
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'AC MODEL IDX'
             */
            acModelIdx: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'AC MODEL NAME'
             */
            acModelName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'AC STATUS'
             */
            acStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'ASSET IDENTIFIER'
             */
            assetIdentifier: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'ASSET IDX'
             */
            assetIdx: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'CG'
             */
            cg: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'COMPANY'
             */
            company: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'CREW COUNT'
             */
            crewCount: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cruse Speed'
             */
            cruseSpeed: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Current Variant Id'
             */
            currentVariantId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'DATA FROM'
             */
            dataFrom: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Default Distance Unit'
             */
            defaultDistanceUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Default Fuel Policy Id'
             */
            defaultFuelPolicyId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Default Fuel Policy Name'
             */
            defaultFuelPolicyName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Default Fuel Unit'
             */
            defaultFuelUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'DEFAULT MODEL'
             */
            defaultModel: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Default Weight Unit'
             */
            defaultWeightUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Dry Operating Moment'
             */
            dryOperatingMoment: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Dry Operating Weight Lbs'
             */
            dryOperatingWeightLbs: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'FIELDBASE'
             */
            fieldbase: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Flat Pitch Fuel Burn(Deck fuel)'
             */
            flatPitchFuelBurnDeckFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            fmsCount: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Fuel Burn'
             */
            fuelBurn: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Index'
             */
            index: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Last Weighing Date'
             */
            lastWeighingDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            maxCrosswind: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'MAX FUEL CAPACITY'
             */
            maxFuelCapacity: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Max Passengers'
             */
            maxPassengers: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'MEL OP LIMIT'
             */
            melOpLimit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'MODEL'
             */
            model: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Org Name'
             */
            orgName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'ORG UNIT'
             */
            orgUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Pilots Included In Empty Weight'
             */
            pilotsIncludedInEmptyWeight: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'REGION NAME'
             */
            regionName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'TIME ZONE'
             */
            timeZone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
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
