pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template DocumentIntegrity() {
    // Private inputs
    signal input content[4]; // Array of 4 signals representing document content blocks
    signal input salt;

    // Public inputs
    signal input expectedHash;

    // Components
    component hasher = Poseidon(5);

    // Constraints
    hasher.inputs[0] <== content[0];
    hasher.inputs[1] <== content[1];
    hasher.inputs[2] <== content[2];
    hasher.inputs[3] <== content[3];
    hasher.inputs[4] <== salt;

    // The output of the hasher must match the expected hash
    expectedHash === hasher.out;
}

component main {public [expectedHash]} = DocumentIntegrity();
