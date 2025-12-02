{
  description = "A Next.js application for karaoke song requests.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, deploy-rs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_20
          self.packages.${system}.deploy
        ];
      };

      packages.${system}.deploy = deploy-rs.lib.${system}.mkDeploy {
        inherit pkgs;
        main = ./apphosting.yaml;
      };

      deploy = self.packages.${system}.deploy;
    };
}
