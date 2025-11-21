#!/usr/bin/env python3
"""
OCI Resource Cleanup Script - v2
Delete all resources in the deepdive-engine compartment
"""

import oci
import sys
import time

# Configuration
COMPARTMENT_OCID = "ocid1.compartment.oc1..aaaaaaaa3ddtttsamndd3ppzewiakxwqqlkjswyweyrk3bu6nwruw32kwnsa"
CONFIG_FILE = "D:/projects/deepdive/.oci/config"

def wait_for_state(get_func, resource_id, target_states, max_wait=120):
    """Wait for resource to reach target state"""
    start = time.time()
    while time.time() - start < max_wait:
        try:
            resource = get_func(resource_id).data
            if resource.lifecycle_state in target_states:
                return True
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                return True  # Resource deleted
        time.sleep(5)
    return False

def main():
    print("Loading OCI configuration...")
    try:
        config = oci.config.from_file(CONFIG_FILE)
    except Exception as e:
        print(f"Error loading config: {e}")
        sys.exit(1)

    print(f"Region: {config['region']}")
    print(f"Compartment: {COMPARTMENT_OCID}")
    print()

    # Initialize clients
    network_client = oci.core.VirtualNetworkClient(config)

    # Get all VCNs
    print("=" * 60)
    print("Finding all VCNs...")
    try:
        vcns = network_client.list_vcns(compartment_id=COMPARTMENT_OCID).data
        active_vcns = [v for v in vcns if v.lifecycle_state not in ['TERMINATED', 'TERMINATING']]
        print(f"Found {len(active_vcns)} active VCN(s)")
    except Exception as e:
        print(f"Error: {e}")
        return

    for vcn in active_vcns:
        print(f"\n{'=' * 60}")
        print(f"Processing VCN: {vcn.display_name}")
        print(f"OCID: {vcn.id}")
        print("=" * 60)

        # Step 1: Clear all Route Table rules first
        print("\n[1/7] Clearing route table rules...")
        try:
            rts = network_client.list_route_tables(compartment_id=COMPARTMENT_OCID, vcn_id=vcn.id).data
            for rt in rts:
                if rt.lifecycle_state not in ['TERMINATED', 'TERMINATING']:
                    print(f"  Clearing rules in: {rt.display_name}")
                    try:
                        network_client.update_route_table(
                            rt.id,
                            oci.core.models.UpdateRouteTableDetails(route_rules=[])
                        )
                    except Exception as e:
                        print(f"  Warning: {e}")
        except Exception as e:
            print(f"  Error: {e}")

        time.sleep(3)

        # Step 2: Delete Subnets
        print("\n[2/7] Deleting subnets...")
        try:
            subnets = network_client.list_subnets(compartment_id=COMPARTMENT_OCID, vcn_id=vcn.id).data
            for subnet in subnets:
                if subnet.lifecycle_state not in ['TERMINATED', 'TERMINATING']:
                    print(f"  Deleting: {subnet.display_name}")
                    try:
                        network_client.delete_subnet(subnet.id)
                    except Exception as e:
                        print(f"  Error: {e}")
            # Wait for subnets to be deleted
            if subnets:
                print("  Waiting for subnets to be deleted...")
                time.sleep(15)
        except Exception as e:
            print(f"  Error: {e}")

        # Step 3: Delete Internet Gateways
        print("\n[3/7] Deleting internet gateways...")
        try:
            igws = network_client.list_internet_gateways(compartment_id=COMPARTMENT_OCID, vcn_id=vcn.id).data
            for igw in igws:
                if igw.lifecycle_state not in ['TERMINATED', 'TERMINATING']:
                    print(f"  Deleting: {igw.display_name}")
                    try:
                        network_client.delete_internet_gateway(igw.id)
                    except Exception as e:
                        print(f"  Error: {e}")
        except Exception as e:
            print(f"  Error: {e}")

        # Step 4: Delete NAT Gateways
        print("\n[4/7] Deleting NAT gateways...")
        try:
            nat_gws = network_client.list_nat_gateways(compartment_id=COMPARTMENT_OCID, vcn_id=vcn.id).data
            for nat in nat_gws:
                if nat.lifecycle_state not in ['TERMINATED', 'TERMINATING']:
                    print(f"  Deleting: {nat.display_name}")
                    network_client.delete_nat_gateway(nat.id)
        except Exception as e:
            print(f"  Error: {e}")

        # Step 5: Delete Service Gateways
        print("\n[5/7] Deleting service gateways...")
        try:
            sgs = network_client.list_service_gateways(compartment_id=COMPARTMENT_OCID, vcn_id=vcn.id).data
            for sg in sgs:
                if sg.lifecycle_state not in ['TERMINATED', 'TERMINATING']:
                    print(f"  Deleting: {sg.display_name}")
                    network_client.delete_service_gateway(sg.id)
        except Exception as e:
            print(f"  Error: {e}")

        time.sleep(5)

        # Step 6: Delete non-default Route Tables and Security Lists
        print("\n[6/7] Deleting route tables and security lists...")
        try:
            rts = network_client.list_route_tables(compartment_id=COMPARTMENT_OCID, vcn_id=vcn.id).data
            for rt in rts:
                if rt.lifecycle_state not in ['TERMINATED', 'TERMINATING'] and "Default" not in rt.display_name:
                    print(f"  Deleting RT: {rt.display_name}")
                    try:
                        network_client.delete_route_table(rt.id)
                    except Exception as e:
                        print(f"  Error: {e}")
        except Exception as e:
            print(f"  Error: {e}")

        try:
            sls = network_client.list_security_lists(compartment_id=COMPARTMENT_OCID, vcn_id=vcn.id).data
            for sl in sls:
                if sl.lifecycle_state not in ['TERMINATED', 'TERMINATING'] and "Default" not in sl.display_name:
                    print(f"  Deleting SL: {sl.display_name}")
                    try:
                        network_client.delete_security_list(sl.id)
                    except Exception as e:
                        print(f"  Error: {e}")
        except Exception as e:
            print(f"  Error: {e}")

        # Wait for all resources to be deleted
        print("\n  Waiting for resources to be fully deleted...")
        time.sleep(15)

        # Step 7: Delete VCN
        print("\n[7/7] Deleting VCN...")
        try:
            network_client.delete_vcn(vcn.id)
            print(f"  VCN '{vcn.display_name}' deletion initiated!")
        except Exception as e:
            print(f"  Error: {e}")
            print("  VCN may still have dependent resources. Please check OCI Console.")

    print("\n" + "=" * 60)
    print("CLEANUP COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Wait 2-3 minutes for all deletions to complete")
    print("2. Go to OCI Console -> Identity -> Compartments")
    print("3. Delete the 'deepdive-engine' compartment")

if __name__ == "__main__":
    main()
