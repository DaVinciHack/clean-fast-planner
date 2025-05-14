import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { FlightFuelDburbury } from './FlightFuelDburbury.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace FuelPolicyBuilder {
    type PropertyKeys = 'alternateFuelDefault' | 'approachFuel' | 'name' | 'approachFuelShow' | 'reserveFuelType' | 'araFuel' | 'reserveFuelDefault' | 'reserveFuelShow' | 'extraFuelValue' | 'unitSystem' | 'extraFuelShow' | 'region' | 'taxiFuelShow' | 'extraFuelDefault' | 'contingencyFuelFlightLegsValue' | 'description' | 'uuid' | 'approachFuelDefault' | 'contingencyFuelAlternateValue' | 'tripFuelShow' | 'extraFuelType' | 'upDatedAt' | 'contingencyFuelFlightLegsType' | 'deckFuelShow' | 'reserveFuelValue' | 'alternateFuelShow' | 'araFuelShow' | 'contingencyFuelAlternateType' | 'contingencyFuelFlightLegsShow' | 'deckFuel' | 'tripFuelDefault' | 'tripFuel' | 'deckFuelDefault' | 'taxiFuel' | 'timeOnTaskFuelDefault' | 'timeOnTaskFuelShow' | 'contingencyFuelFlightLegsDefault' | 'taxiFuelDefault' | 'contingencyFuelAlternateShow' | 'araFuelDefault' | 'alternateFuel' | 'upDatedBy' | 'timeOnTaskFuel' | 'contingencyFuelAlternateDefault';
    interface Links {
        readonly flightFuelDburbury: FlightFuelDburbury.ObjectSet;
    }
    interface Props {
        readonly alternateFuel: $PropType['integer'] | undefined;
        readonly alternateFuelDefault: $PropType['integer'] | undefined;
        readonly alternateFuelShow: $PropType['boolean'] | undefined;
        readonly approachFuel: $PropType['integer'] | undefined;
        readonly approachFuelDefault: $PropType['integer'] | undefined;
        readonly approachFuelShow: $PropType['boolean'] | undefined;
        readonly araFuel: $PropType['integer'] | undefined;
        readonly araFuelDefault: $PropType['integer'] | undefined;
        readonly araFuelShow: $PropType['boolean'] | undefined;
        readonly contingencyFuelAlternateDefault: $PropType['integer'] | undefined;
        readonly contingencyFuelAlternateShow: $PropType['boolean'] | undefined;
        readonly contingencyFuelAlternateType: $PropType['string'] | undefined;
        readonly contingencyFuelAlternateValue: $PropType['integer'] | undefined;
        readonly contingencyFuelFlightLegsDefault: $PropType['integer'] | undefined;
        readonly contingencyFuelFlightLegsShow: $PropType['boolean'] | undefined;
        readonly contingencyFuelFlightLegsType: $PropType['string'] | undefined;
        readonly contingencyFuelFlightLegsValue: $PropType['integer'] | undefined;
        readonly deckFuel: $PropType['integer'] | undefined;
        readonly deckFuelDefault: $PropType['integer'] | undefined;
        readonly deckFuelShow: $PropType['boolean'] | undefined;
        readonly description: $PropType['string'] | undefined;
        readonly extraFuelDefault: $PropType['integer'] | undefined;
        readonly extraFuelShow: $PropType['boolean'] | undefined;
        readonly extraFuelType: $PropType['string'] | undefined;
        readonly extraFuelValue: $PropType['integer'] | undefined;
        readonly name: $PropType['string'] | undefined;
        readonly region: $PropType['string'] | undefined;
        readonly reserveFuelDefault: $PropType['integer'] | undefined;
        readonly reserveFuelShow: $PropType['boolean'] | undefined;
        readonly reserveFuelType: $PropType['string'] | undefined;
        readonly reserveFuelValue: $PropType['integer'] | undefined;
        readonly taxiFuel: $PropType['integer'] | undefined;
        readonly taxiFuelDefault: $PropType['integer'] | undefined;
        readonly taxiFuelShow: $PropType['boolean'] | undefined;
        readonly timeOnTaskFuel: $PropType['integer'] | undefined;
        readonly timeOnTaskFuelDefault: $PropType['integer'] | undefined;
        readonly timeOnTaskFuelShow: $PropType['boolean'] | undefined;
        readonly tripFuel: $PropType['integer'] | undefined;
        readonly tripFuelDefault: $PropType['integer'] | undefined;
        readonly tripFuelShow: $PropType['boolean'] | undefined;
        readonly unitSystem: $PropType['string'] | undefined;
        readonly upDatedAt: $PropType['timestamp'] | undefined;
        readonly upDatedBy: $PropType['string'] | undefined;
        readonly uuid: $PropType['string'];
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<FuelPolicyBuilder, FuelPolicyBuilder.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof FuelPolicyBuilder.Props = keyof FuelPolicyBuilder.Props> = $Osdk.Instance<FuelPolicyBuilder, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof FuelPolicyBuilder.Props = keyof FuelPolicyBuilder.Props> = OsdkInstance<OPTIONS, K>;
}
export interface FuelPolicyBuilder extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'FuelPolicyBuilder';
    __DefinitionMetadata?: {
        objectSet: FuelPolicyBuilder.ObjectSet;
        props: FuelPolicyBuilder.Props;
        linksType: FuelPolicyBuilder.Links;
        strictProps: FuelPolicyBuilder.StrictProps;
        apiName: 'FuelPolicyBuilder';
        description: 'To build Fuel policies world wide';
        displayName: 'FuelPolicyBuilder';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'fuel';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            flightFuelDburbury: $ObjectMetadata.Link<FlightFuelDburbury, true>;
        };
        pluralDisplayName: 'Fuel Policy Builders';
        primaryKeyApiName: 'uuid';
        primaryKeyType: 'string';
        properties: {
            /**
             *   display name: 'Alternate Fuel'
             */
            alternateFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Alternate Fuel Default'
             */
            alternateFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Alternate Fuel Show'
             */
            alternateFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Approach Fuel'
             */
            approachFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Approach Fuel Default'
             */
            approachFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Approach Fuel Show'
             */
            approachFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Ara Fuel'
             */
            araFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ara Fuel Default'
             */
            araFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ara Fuel Show'
             */
            araFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Alternate Default'
             */
            contingencyFuelAlternateDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Alternate Show'
             */
            contingencyFuelAlternateShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Alternate Type'
             */
            contingencyFuelAlternateType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Alternate Value'
             */
            contingencyFuelAlternateValue: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Flight Legs Default'
             */
            contingencyFuelFlightLegsDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Flight Legs Show'
             */
            contingencyFuelFlightLegsShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Flight Legs Type'
             */
            contingencyFuelFlightLegsType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Contingency Fuel Flight Legs Value'
             */
            contingencyFuelFlightLegsValue: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Fuel'
             */
            deckFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Fuel Default'
             */
            deckFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Fuel Show'
             */
            deckFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Description'
             */
            description: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Extra Fuel Default'
             */
            extraFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Extra Fuel Show'
             */
            extraFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Extra Fuel Type'
             */
            extraFuelType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Extra Fuel Value'
             */
            extraFuelValue: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Name'
             */
            name: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Region'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Reserve Fuel Default'
             */
            reserveFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Reserve Fuel Show'
             */
            reserveFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Reserve Fuel Type'
             */
            reserveFuelType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Reserve Fuel Value'
             */
            reserveFuelValue: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Taxi Fuel'
             */
            taxiFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Taxi Fuel Default'
             */
            taxiFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Taxi Fuel Show'
             */
            taxiFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Time On Task Fuel'
             */
            timeOnTaskFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Time On Task Fuel Default'
             */
            timeOnTaskFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Time On Task Fuel Show'
             */
            timeOnTaskFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Trip Fuel'
             */
            tripFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Trip Fuel Default'
             */
            tripFuelDefault: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Trip Fuel Show'
             */
            tripFuelShow: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Unit System'
             */
            unitSystem: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Up Dated At'
             */
            upDatedAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Up Dated By'
             */
            upDatedBy: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Uuid'
             */
            uuid: $PropertyDef<'string', 'non-nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.898b54c0-708f-480b-bafb-f816759e3ae1';
        status: 'EXPERIMENTAL';
        titleProperty: 'name';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const FuelPolicyBuilder: FuelPolicyBuilder;
