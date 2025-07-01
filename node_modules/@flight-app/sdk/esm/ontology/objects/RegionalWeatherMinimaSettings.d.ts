import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace RegionalWeatherMinimaSettings {
    type PropertyKeys = 'updatedBy' | 'rigDayMinVisibility' | 'uniqueId' | 'averagePassengerWeight' | 'alternateDayMinCeiling' | 'takeoffNightMinCeiling' | 'geoPoint' | 'rigDayAraMinVisibility' | 'rigNightMinCeiling' | 'region' | 'alternateDayMinVisibility' | 'rigDayAraMinCeiling' | 'approachNightMinCeiling' | 'rigDayMinCeiling' | 'rigNightAraMinCeiling' | 'takeoffDayMinCeiling' | 'approachDayMinVisibility' | 'alternateNightMinCeiling' | 'maxWindSpeed' | 'timestamp' | 'maxCrossWind' | 'rigNightMinVisibility' | 'alternateNightMinVisibility' | 'takeoffNightMinVisibility' | 'approachDayMinCeiling' | 'rigNightAraMinVisibility' | 'approachNightMinVisibility' | 'takeoffDayMinVisibility';
    type Links = {};
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Day Min Ceiling'
         */
        readonly alternateDayMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Day Min Visibility'
         */
        readonly alternateDayMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Night Min Ceiling'
         */
        readonly alternateNightMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Night Min Visibility'
         */
        readonly alternateNightMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Approach Day Min Ceiling'
         */
        readonly approachDayMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Approach Day Min Visibility'
         */
        readonly approachDayMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Approach Night Min Ceiling'
         */
        readonly approachNightMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Approach Night Min Visibility'
         */
        readonly approachNightMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly averagePassengerWeight: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Geo Point'
         */
        readonly geoPoint: $PropType['geopoint'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Max Cross Wind'
         */
        readonly maxCrossWind: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Max Wind Speed'
         */
        readonly maxWindSpeed: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Region'
         */
        readonly region: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Day Ara Min Ceiling'
         */
        readonly rigDayAraMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Day Ara Min Visibility'
         */
        readonly rigDayAraMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Day Min Ceiling'
         */
        readonly rigDayMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Day Min Visibility'
         */
        readonly rigDayMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Night Ara Min Ceiling'
         */
        readonly rigNightAraMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Night Ara Min Visibility'
         */
        readonly rigNightAraMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Night Min Ceiling'
         */
        readonly rigNightMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Rig Night Min Visibility'
         */
        readonly rigNightMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Takeoff Day Min Ceiling'
         */
        readonly takeoffDayMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Takeoff Day Min Visibility'
         */
        readonly takeoffDayMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Takeoff Night Min Ceiling'
         */
        readonly takeoffNightMinCeiling: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Takeoff Night Min Visibility'
         */
        readonly takeoffNightMinVisibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Timestamp'
         */
        readonly timestamp: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Unique ID'
         */
        readonly uniqueId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Updated By'
         */
        readonly updatedBy: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<RegionalWeatherMinimaSettings, RegionalWeatherMinimaSettings.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof RegionalWeatherMinimaSettings.Props = keyof RegionalWeatherMinimaSettings.Props> = $Osdk.Instance<RegionalWeatherMinimaSettings, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof RegionalWeatherMinimaSettings.Props = keyof RegionalWeatherMinimaSettings.Props> = OsdkInstance<OPTIONS, K>;
}
export interface RegionalWeatherMinimaSettings extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'RegionalWeatherMinimaSettings';
    __DefinitionMetadata?: {
        objectSet: RegionalWeatherMinimaSettings.ObjectSet;
        props: RegionalWeatherMinimaSettings.Props;
        linksType: RegionalWeatherMinimaSettings.Links;
        strictProps: RegionalWeatherMinimaSettings.StrictProps;
        apiName: 'RegionalWeatherMinimaSettings';
        description: 'Setting for regional minimas';
        displayName: 'Regional Weather Minima Settings';
        icon: {
            type: 'blueprint';
            color: '#F5498B';
            name: 'rain';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Regional Weather Minima Settings';
        primaryKeyApiName: 'uniqueId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Day Min Ceiling'
             */
            alternateDayMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Day Min Visibility'
             */
            alternateDayMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Night Min Ceiling'
             */
            alternateNightMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Night Min Visibility'
             */
            alternateNightMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Approach Day Min Ceiling'
             */
            approachDayMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Approach Day Min Visibility'
             */
            approachDayMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Approach Night Min Ceiling'
             */
            approachNightMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Approach Night Min Visibility'
             */
            approachNightMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            averagePassengerWeight: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Geo Point'
             */
            geoPoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Max Cross Wind'
             */
            maxCrossWind: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Max Wind Speed'
             */
            maxWindSpeed: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Region'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Day Ara Min Ceiling'
             */
            rigDayAraMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Day Ara Min Visibility'
             */
            rigDayAraMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Day Min Ceiling'
             */
            rigDayMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Day Min Visibility'
             */
            rigDayMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Night Ara Min Ceiling'
             */
            rigNightAraMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Night Ara Min Visibility'
             */
            rigNightAraMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Night Min Ceiling'
             */
            rigNightMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Rig Night Min Visibility'
             */
            rigNightMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Takeoff Day Min Ceiling'
             */
            takeoffDayMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Takeoff Day Min Visibility'
             */
            takeoffDayMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Takeoff Night Min Ceiling'
             */
            takeoffNightMinCeiling: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Takeoff Night Min Visibility'
             */
            takeoffNightMinVisibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Timestamp'
             */
            timestamp: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Unique ID'
             */
            uniqueId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Updated By'
             */
            updatedBy: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.43a0da92-4be6-4832-81ff-c7290a85451f';
        status: 'EXPERIMENTAL';
        titleProperty: 'region';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const RegionalWeatherMinimaSettings: RegionalWeatherMinimaSettings;
