
{
  description = "A Next.js application for karaoke";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        node = pkgs.nodejs-20_x;
      in
      {
        # Defines a development shell with Node.js and npm.
        devShells.default = pkgs.mkShell {
          buildInputs = [
            node
          ];
        };

        # Defines the default application to run.
        # This is what Firebase App Hosting uses to start your app.
        apps.default = {
          type = "app";
          program = "${pkgs.writeShellScript "start-app" ''
            exec ${node}/bin/npm run start
          ''}";
        };
      }
    );
}
