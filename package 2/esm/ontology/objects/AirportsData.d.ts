import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace AirportsData {
    type PropertyKeys = 'runways' | 'visibilityRvrfeet' | 'geopointString' | 'minimumCeilingFt' | 'approachType' | 'visibility' | 'visibilityUsinSm' | 'airportName' | 'icaoCode' | 'region' | 'fmsRequirement' | 'costIndex' | 'uuid' | 'geopoint' | 'icaoRunways';
    type Links = {};
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Airport Name'
         */
        readonly airportName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Approach Type'
         */
        readonly approachType: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cost Index'
         */
        readonly costIndex: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'FMS Requirement'
         */
        readonly fmsRequirement: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Geopoint'
         */
        readonly geopoint: $PropType['geopoint'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly geopointString: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Icao Code'
         */
        readonly icaoCode: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Icao Runways'
         */
        readonly icaoRunways: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Minimum Ceiling Ft'
         */
        readonly minimumCeilingFt: $PropType['string'] | undefined;
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
         *   display name: 'Runways'
         */
        readonly runways: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'UUID'
         */
        readonly uuid: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Visibility'
         */
        readonly visibility: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'visibilityRVRFeet'
         */
        readonly visibilityRvrfeet: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'visibilityUSinSM'
         */
        readonly visibilityUsinSm: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<AirportsData, AirportsData.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof AirportsData.Props = keyof AirportsData.Props> = $Osdk.Instance<AirportsData, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof AirportsData.Props = keyof AirportsData.Props> = OsdkInstance<OPTIONS, K>;
}
export interface AirportsData extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'AirportsData';
    __DefinitionMetadata?: {
        objectSet: AirportsData.ObjectSet;
        props: AirportsData.Props;
        linksType: AirportsData.Links;
        strictProps: AirportsData.StrictProps;
        apiName: 'AirportsData';
        description: 'Airports data for approaches and cost index';
        displayName: 'Airports Data';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'airplane';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Airports Data';
        primaryKeyApiName: 'uuid';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Airport Name'
             */
            airportName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Approach Type'
             */
            approachType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cost Index'
             */
            costIndex: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'FMS Requirement'
             */
            fmsRequirement: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Geopoint'
             */
            geopoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            geopointString: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Icao Code'
             */
            icaoCode: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Icao Runways'
             */
            icaoRunways: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Minimum Ceiling Ft'
             */
            minimumCeilingFt: $PropertyDef<'string', 'nullable', 'single'>;
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
             *   display name: 'Runways'
             */
            runways: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'UUID'
             */
            uuid: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Visibility'
             */
            visibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'visibilityRVRFeet'
             */
            visibilityRvrfeet: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'visibilityUSinSM'
             */
            visibilityUsinSm: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.cb4bc133-03d1-4456-b47f-4d52a77897b1';
        status: 'EXPERIMENTAL';
        titleProperty: 'icaoRunways';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const AirportsData: AirportsData;
