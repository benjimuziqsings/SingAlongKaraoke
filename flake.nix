{
  description = "Sing A Long Karaoke";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/f720de59066162ee879adcc8c79e15c51fe6bfb4";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        deployment = deploy-rs.lib.${system}.mkDeployment {
          inherit pkgs;

          deployment.name = "sing-a-long-karaoke-deployment";

          # This is where we can specify what's in the deployment
          deployment.build = {
            # You can copy files from the flake to the deployment machine.
            # The `self` parameter refers to the flake's root directory.
            copy = [
              self
            ];
          };

          # The activation script is run once on the first deployment.
          # Subsequent deployments will only run the activation script if the script itself has changed.
          script = ''
            mkdir -p /var/log/sing-a-long-karaoke
            touch /var/log/sing-a-long-karaoke/app.log
            
            # Install npm dependencies
            npm install
            
            # Build the Next.js app
            npm run build
          '';

          # This specifies the systemd service to run.
          # The service will be automatically started and enabled.
          # It will also be restarted on subsequent deployments.
          service = {
            # This is the command that will be run to start the service.
            # It will be run from the root of the deployment directory.
            command = "${pkgs.nodejs}/bin/npm start";

            # You can specify environment variables for the service.
            # In this case we are just using the default PORT, but you could add more.
            # environment = {
            #   PORT = "3000";
            # };
          };
        };
      in
      {
        # This is the deploy attribute the build system is looking for.
        packages.deploy = deployment;
      }
    );
}
