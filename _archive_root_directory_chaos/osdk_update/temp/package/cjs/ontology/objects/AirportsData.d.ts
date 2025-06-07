import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace AirportsData {
    type PropertyKeys = 'runways' | 'visibilityRvrfeet' | 'geopointString' | 'minimumCeilingFt' | 'approachType' | 'visibility' | 'visibilityUsinSm' | 'airportName' | 'icaoCode' | 'region' | 'fmsRequirement' | 'costIndex' | 'uuid' | 'geopoint' | 'icaoRunways';
    type Links = {};
    interface Props {
        readonly airportName: $PropType['string'] | undefined;
        readonly approachType: $PropType['string'] | undefined;
        readonly costIndex: $PropType['integer'] | undefined;
        readonly fmsRequirement: $PropType['string'] | undefined;
        readonly geopoint: $PropType['geopoint'] | undefined;
        readonly geopointString: $PropType['string'] | undefined;
        readonly icaoCode: $PropType['string'] | undefined;
        readonly icaoRunways: $PropType['string'] | undefined;
        readonly minimumCeilingFt: $PropType['string'] | undefined;
        readonly region: $PropType['string'] | undefined;
        readonly runways: $PropType['integer'] | undefined;
        readonly uuid: $PropType['string'];
        readonly visibility: $PropType['integer'] | undefined;
        readonly visibilityRvrfeet: $PropType['string'] | undefined;
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
             *   display name: 'Airport Name'
             */
            airportName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Approach Type'
             */
            approachType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Cost Index'
             */
            costIndex: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'FMS Requirement'
             */
            fmsRequirement: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Geopoint'
             */
            geopoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            geopointString: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Icao Code'
             */
            icaoCode: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Icao Runways'
             */
            icaoRunways: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Minimum Ceiling Ft'
             */
            minimumCeilingFt: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Region'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Runways'
             */
            runways: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'UUID'
             */
            uuid: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             *   display name: 'Visibility'
             */
            visibility: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'visibilityRVRFeet'
             */
            visibilityRvrfeet: $PropertyDef<'string', 'nullable', 'single'>;
            /**
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
